import { Router } from 'express';
import supabase from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { createAchievement, checkFirstPathAchievement, checkMilestoneAchievements } from './achievements.js';
import { validatePathData, validateProgressUpdate } from '../middleware/validation.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Helper to calculate totals from path data
const calculatePathTotals = (pathData) => {
  let totalTopics = 0;
  pathData.forEach(stage => {
    totalTopics += stage.keyTopics?.length || 0;
  });
  return {
    totalStages: pathData.length,
    totalTopics
  };
};

// GET /api/paths - Get all user's saved paths
router.get('/', async (req, res) => {
  try {
    const { data: paths, error } = await supabase
      .from('user_paths')
      .select('id, topic, total_stages, total_topics, completed_stages, completed_topics, status, started_at, last_accessed_at, completed_at')
      .eq('user_id', req.user.id)
      .neq('status', 'archived')
      .order('last_accessed_at', { ascending: false });

    if (error) throw error;

    // Transform to camelCase and calculate progress percentage
    const pathsWithProgress = (paths || []).map(p => ({
      id: p.id,
      topic: p.topic,
      totalStages: p.total_stages,
      totalTopics: p.total_topics,
      completedStages: p.completed_stages,
      completedTopics: p.completed_topics,
      status: p.status,
      startedAt: p.started_at,
      lastAccessedAt: p.last_accessed_at,
      completedAt: p.completed_at,
      progress_percent: p.total_topics > 0 
        ? Math.round((p.completed_topics / p.total_topics) * 100) 
        : 0
    }));

    res.json({ paths: pathsWithProgress });
  } catch (error) {
    console.error('Get paths error:', error);
    res.status(500).json({ error: 'Failed to fetch paths.' });
  }
});

// GET /api/paths/:id - Get specific path with full data and progress
router.get('/:id', async (req, res) => {
  try {
    const { data: path, error } = await supabase
      .from('user_paths')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !path) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    // Parse path data
    const pathData = JSON.parse(path.path_data);

    // Get all progress items for this path
    const { data: progressItems } = await supabase
      .from('path_progress')
      .select('stage_index, item_type, item_index, is_completed, completed_at, notes')
      .eq('path_id', path.id);

    // Create a lookup map for quick access
    const progressMap = {};
    (progressItems || []).forEach(item => {
      const key = `${item.stage_index}-${item.item_type}-${item.item_index}`;
      progressMap[key] = item;
    });

    // Update last accessed
    await supabase
      .from('user_paths')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', path.id);

    res.json({
      id: path.id,
      topic: path.topic,
      status: path.status,
      totalStages: path.total_stages,
      totalTopics: path.total_topics,
      completedStages: path.completed_stages,
      completedTopics: path.completed_topics,
      startedAt: path.started_at,
      lastAccessedAt: path.last_accessed_at,
      completedAt: path.completed_at,
      pathData,
      progressMap
    });
  } catch (error) {
    console.error('Get path error:', error);
    res.status(500).json({ error: 'Failed to fetch path.' });
  }
});

// POST /api/paths - Save a new learning path
router.post('/', validatePathData, async (req, res) => {
  try {
    const { topic, pathData } = req.body;

    const { totalStages, totalTopics } = calculatePathTotals(pathData);

    // Check if user already has this topic saved
    const { data: existing } = await supabase
      .from('user_paths')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('topic', topic)
      .eq('status', 'active')
      .single();

    if (existing) {
      return res.status(409).json({ 
        error: 'You already have an active path for this topic.',
        existingPathId: existing.id
      });
    }

    const { data: newPath, error } = await supabase
      .from('user_paths')
      .insert({
        user_id: req.user.id,
        topic,
        path_data: JSON.stringify(pathData),
        total_stages: totalStages,
        total_topics: totalTopics
      })
      .select('id')
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Path saved successfully.',
      pathId: newPath.id,
      topic,
      totalStages,
      totalTopics
    });
  } catch (error) {
    console.error('Save path error:', error);
    res.status(500).json({ error: 'Failed to save path.' });
  }
});

// PUT /api/paths/:id/progress - Update progress on a specific item
router.put('/:id/progress', validateProgressUpdate, async (req, res) => {
  try {
    const { stageIndex, itemType, itemIndex, isCompleted, notes } = req.body;

    // Validate path belongs to user
    const { data: path, error: pathError } = await supabase
      .from('user_paths')
      .select('id, total_topics, status')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (pathError || !path) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    // Upsert progress using Supabase's upsert
    const { error: upsertError } = await supabase
      .from('path_progress')
      .upsert({
        path_id: path.id,
        user_id: req.user.id,
        stage_index: stageIndex,
        item_type: itemType,
        item_index: itemIndex,
        is_completed: isCompleted ? 1 : 0,
        completed_at: isCompleted ? new Date().toISOString() : null,
        notes: notes || null
      }, {
        onConflict: 'path_id,stage_index,item_type,item_index'
      });

    if (upsertError) throw upsertError;

    // Recalculate completion stats
    const { data: progressData } = await supabase
      .from('path_progress')
      .select('item_type, is_completed')
      .eq('path_id', path.id);

    const stats = {
      completed_topics: 0,
      completed_stages: 0
    };

    (progressData || []).forEach(item => {
      if (item.is_completed === 1) {
        if (item.item_type === 'topic') stats.completed_topics++;
        if (item.item_type === 'stage') stats.completed_stages++;
      }
    });

    // Check if fully completed
    const isFullyCompleted = stats.completed_topics >= path.total_topics;
    const isNewCompletion = isFullyCompleted && path.status !== 'completed';

    // Update path stats
    const updateData = {
      completed_topics: stats.completed_topics,
      completed_stages: stats.completed_stages,
      last_accessed_at: new Date().toISOString()
    };

    if (isFullyCompleted) {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('user_paths')
      .update(updateData)
      .eq('id', path.id);

    // Award achievements if newly completed
    let newAchievements = [];
    if (isNewCompletion) {
      // Get path topic for achievement
      const { data: pathInfo } = await supabase
        .from('user_paths')
        .select('topic, total_stages, total_topics')
        .eq('id', path.id)
        .single();

      if (pathInfo) {
        // Award path completion achievement
        const pathAchievement = await createAchievement(
          req.user.id,
          path.id,
          'path_completion',
          `${pathInfo.topic} Master`,
          `Completed the ${pathInfo.topic} learning path with ${pathInfo.total_topics} topics`,
          pathInfo.topic,
          'trophy'
        );
        if (pathAchievement) newAchievements.push(pathAchievement);

        // Check for first path achievement
        const firstPath = await checkFirstPathAchievement(req.user.id);
        if (firstPath) newAchievements.push(firstPath);

        // Check for milestone achievements
        const milestones = await checkMilestoneAchievements(req.user.id);
        newAchievements = newAchievements.concat(milestones);
      }
    }

    res.json({
      message: 'Progress updated.',
      completedTopics: stats.completed_topics,
      completedStages: stats.completed_stages,
      isFullyCompleted,
      newAchievements
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress.' });
  }
});

// DELETE /api/paths/:id - Archive/delete a path
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_paths')
      .update({ status: 'archived' })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    res.json({ message: 'Path archived successfully.' });
  } catch (error) {
    console.error('Delete path error:', error);
    res.status(500).json({ error: 'Failed to archive path.' });
  }
});

// POST /api/paths/:id/restart - Restart a path (clear progress)
router.post('/:id/restart', async (req, res) => {
  try {
    const { data: path } = await supabase
      .from('user_paths')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!path) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    // Clear all progress
    await supabase
      .from('path_progress')
      .delete()
      .eq('path_id', path.id);

    // Reset path stats
    await supabase
      .from('user_paths')
      .update({
        completed_topics: 0,
        completed_stages: 0,
        status: 'active',
        completed_at: null,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', path.id);

    res.json({ message: 'Path progress reset.' });
  } catch (error) {
    console.error('Restart path error:', error);
    res.status(500).json({ error: 'Failed to restart path.' });
  }
});

export default router;
