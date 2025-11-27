import { Router } from 'express';
import db from '../db/index.js';
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

// Helper to calculate completion stats
const getPathCompletion = (pathId) => {
  const progress = db.prepare(`
    SELECT 
      COUNT(CASE WHEN item_type = 'topic' AND is_completed = 1 THEN 1 END) as completed_topics,
      COUNT(CASE WHEN item_type = 'project' AND is_completed = 1 THEN 1 END) as completed_projects,
      COUNT(CASE WHEN item_type = 'stage' AND is_completed = 1 THEN 1 END) as completed_stages
    FROM path_progress 
    WHERE path_id = ?
  `).get(pathId);
  
  return progress || { completed_topics: 0, completed_projects: 0, completed_stages: 0 };
};

// GET /api/paths - Get all user's saved paths
router.get('/', (req, res) => {
  try {
    const paths = db.prepare(`
      SELECT id, topic, total_stages, total_topics, completed_stages, completed_topics, 
             status, started_at, last_accessed_at, completed_at
      FROM user_paths 
      WHERE user_id = ? 
      ORDER BY last_accessed_at DESC
    `).all(req.user.id);

    // Calculate progress percentage for each
    const pathsWithProgress = paths.map(p => ({
      ...p,
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
router.get('/:id', (req, res) => {
  try {
    const path = db.prepare(`
      SELECT * FROM user_paths WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!path) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    // Parse path data
    const pathData = JSON.parse(path.path_data);

    // Get all progress items for this path
    const progressItems = db.prepare(`
      SELECT stage_index, item_type, item_index, is_completed, completed_at, notes
      FROM path_progress 
      WHERE path_id = ?
    `).all(path.id);

    // Create a lookup map for quick access
    const progressMap = {};
    progressItems.forEach(item => {
      const key = `${item.stage_index}-${item.item_type}-${item.item_index}`;
      progressMap[key] = item;
    });

    // Update last accessed
    db.prepare(`
      UPDATE user_paths SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(path.id);

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
router.post('/', validatePathData, (req, res) => {
  try {
    const { topic, pathData } = req.body;

    const { totalStages, totalTopics } = calculatePathTotals(pathData);

    // Check if user already has this topic saved
    const existing = db.prepare(`
      SELECT id FROM user_paths WHERE user_id = ? AND topic = ? AND status = 'active'
    `).get(req.user.id, topic);

    if (existing) {
      return res.status(409).json({ 
        error: 'You already have an active path for this topic.',
        existingPathId: existing.id
      });
    }

    const result = db.prepare(`
      INSERT INTO user_paths (user_id, topic, path_data, total_stages, total_topics)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, topic, JSON.stringify(pathData), totalStages, totalTopics);

    res.status(201).json({
      message: 'Path saved successfully.',
      pathId: result.lastInsertRowid,
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
router.put('/:id/progress', validateProgressUpdate, (req, res) => {
  try {
    const { stageIndex, itemType, itemIndex, isCompleted, notes } = req.body;

    // Validate path belongs to user
    const path = db.prepare(`
      SELECT id, total_topics FROM user_paths WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!path) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    // Upsert progress
    db.prepare(`
      INSERT INTO path_progress (path_id, user_id, stage_index, item_type, item_index, is_completed, completed_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path_id, stage_index, item_type, item_index) 
      DO UPDATE SET 
        is_completed = excluded.is_completed,
        completed_at = CASE WHEN excluded.is_completed = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
        notes = COALESCE(excluded.notes, notes)
    `).run(
      path.id, 
      req.user.id, 
      stageIndex, 
      itemType, 
      itemIndex, 
      isCompleted ? 1 : 0,
      isCompleted ? new Date().toISOString() : null,
      notes || null
    );

    // Recalculate completion stats
    const stats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN item_type = 'topic' AND is_completed = 1 THEN 1 END) as completed_topics,
        COUNT(CASE WHEN item_type = 'stage' AND is_completed = 1 THEN 1 END) as completed_stages
      FROM path_progress 
      WHERE path_id = ?
    `).get(path.id);

    // Update path stats
    const isFullyCompleted = stats.completed_topics >= path.total_topics;
    
    // Check if this is a NEW completion (wasn't completed before)
    const wasCompleted = db.prepare(`
      SELECT status FROM user_paths WHERE id = ?
    `).get(path.id);
    const isNewCompletion = isFullyCompleted && wasCompleted.status !== 'completed';
    
    db.prepare(`
      UPDATE user_paths 
      SET completed_topics = ?, 
          completed_stages = ?,
          status = CASE WHEN ? THEN 'completed' ELSE status END,
          completed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE completed_at END,
          last_accessed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      stats.completed_topics, 
      stats.completed_stages,
      isFullyCompleted ? 1 : 0,
      isFullyCompleted ? 1 : 0,
      path.id
    );

    // Award achievements if newly completed
    let newAchievements = [];
    if (isNewCompletion) {
      // Get path topic for achievement
      const pathInfo = db.prepare(`SELECT topic, total_stages, total_topics FROM user_paths WHERE id = ?`).get(path.id);
      
      // Award path completion achievement
      const pathAchievement = createAchievement(
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
      const firstPath = checkFirstPathAchievement(req.user.id);
      if (firstPath) newAchievements.push(firstPath);

      // Check for milestone achievements
      const milestones = checkMilestoneAchievements(req.user.id);
      newAchievements = newAchievements.concat(milestones);
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
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE user_paths SET status = 'archived' WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    res.json({ message: 'Path archived successfully.' });
  } catch (error) {
    console.error('Delete path error:', error);
    res.status(500).json({ error: 'Failed to archive path.' });
  }
});

// POST /api/paths/:id/restart - Restart a path (clear progress)
router.post('/:id/restart', (req, res) => {
  try {
    const path = db.prepare(`
      SELECT id FROM user_paths WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!path) {
      return res.status(404).json({ error: 'Path not found.' });
    }

    // Clear all progress
    db.prepare(`DELETE FROM path_progress WHERE path_id = ?`).run(path.id);

    // Reset path stats
    db.prepare(`
      UPDATE user_paths 
      SET completed_topics = 0, completed_stages = 0, status = 'active',
          completed_at = NULL, last_accessed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(path.id);

    res.json({ message: 'Path progress reset.' });
  } catch (error) {
    console.error('Restart path error:', error);
    res.status(500).json({ error: 'Failed to restart path.' });
  }
});

export default router;

