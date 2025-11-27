import { Router } from 'express';
import supabase from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/achievements - Get all user's achievements
router.get('/', async (req, res) => {
  try {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('id, type, title, description, topic, icon, earned_at, path_id')
      .eq('user_id', req.user.id)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    res.json({ achievements: achievements || [] });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements.' });
  }
});

// GET /api/achievements/stats - Get achievement stats
router.get('/stats', async (req, res) => {
  try {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('type')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const stats = {
      total_achievements: achievements?.length || 0,
      paths_completed: achievements?.filter(a => a.type === 'path_completion').length || 0,
      milestones: achievements?.filter(a => a.type === 'first_path').length || 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Helper function to create an achievement (used internally)
export const createAchievement = async (userId, pathId, type, title, description, topic, icon = 'trophy') => {
  // Check if achievement already exists for this path
  if (pathId) {
    const { data: existing } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .eq('type', type)
      .single();
    
    if (existing) {
      return null; // Already has this achievement
    }
  }

  const { data: newAchievement, error } = await supabase
    .from('achievements')
    .insert({
      user_id: userId,
      path_id: pathId,
      type,
      title,
      description,
      topic,
      icon
    })
    .select('id, type, title, description, topic, icon')
    .single();

  if (error) {
    console.error('Create achievement error:', error);
    return null;
  }

  return newAchievement;
};

// Check and award first path completion achievement
export const checkFirstPathAchievement = async (userId) => {
  const { data: paths } = await supabase
    .from('user_paths')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (paths?.length === 1) {
    return await createAchievement(
      userId,
      null,
      'first_path',
      'First Steps',
      'Completed your first learning path',
      null,
      'rocket'
    );
  }
  return null;
};

// Check milestone achievements (5, 10, 25, 50 paths)
export const checkMilestoneAchievements = async (userId) => {
  const { data: paths } = await supabase
    .from('user_paths')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const pathCount = paths?.length || 0;

  const milestones = [
    { count: 5, title: 'Dedicated Learner', desc: 'Completed 5 learning paths', icon: 'star' },
    { count: 10, title: 'Knowledge Seeker', desc: 'Completed 10 learning paths', icon: 'zap' },
    { count: 25, title: 'Path Master', desc: 'Completed 25 learning paths', icon: 'crown' },
    { count: 50, title: 'Enlightened One', desc: 'Completed 50 learning paths', icon: 'sun' },
  ];

  const newAchievements = [];
  
  for (const milestone of milestones) {
    if (pathCount >= milestone.count) {
      const { data: existing } = await supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('type', `milestone_${milestone.count}`)
        .single();
      
      if (!existing) {
        const achievement = await createAchievement(
          userId,
          null,
          `milestone_${milestone.count}`,
          milestone.title,
          milestone.desc,
          null,
          milestone.icon
        );
        if (achievement) newAchievements.push(achievement);
      }
    }
  }

  return newAchievements;
};

export default router;
