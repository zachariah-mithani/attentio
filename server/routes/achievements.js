import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/achievements - Get all user's achievements
router.get('/', (req, res) => {
  try {
    const achievements = db.prepare(`
      SELECT id, type, title, description, topic, icon, earned_at, path_id
      FROM achievements 
      WHERE user_id = ? 
      ORDER BY earned_at DESC
    `).all(req.user.id);

    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements.' });
  }
});

// GET /api/achievements/stats - Get achievement stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN type = 'path_completion' THEN 1 END) as paths_completed,
        COUNT(CASE WHEN type = 'first_path' THEN 1 END) as milestones
      FROM achievements 
      WHERE user_id = ?
    `).get(req.user.id);

    res.json({ stats });
  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Helper function to create an achievement (used internally)
export const createAchievement = (userId, pathId, type, title, description, topic, icon = 'trophy') => {
  // Check if achievement already exists for this path
  if (pathId) {
    const existing = db.prepare(`
      SELECT id FROM achievements WHERE user_id = ? AND path_id = ? AND type = ?
    `).get(userId, pathId, type);
    
    if (existing) {
      return null; // Already has this achievement
    }
  }

  const result = db.prepare(`
    INSERT INTO achievements (user_id, path_id, type, title, description, topic, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, pathId, type, title, description, topic, icon);

  return {
    id: result.lastInsertRowid,
    type,
    title,
    description,
    topic,
    icon
  };
};

// Check and award first path completion achievement
export const checkFirstPathAchievement = (userId) => {
  const pathCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_paths WHERE user_id = ? AND status = 'completed'
  `).get(userId);

  if (pathCount.count === 1) {
    return createAchievement(
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
export const checkMilestoneAchievements = (userId) => {
  const pathCount = db.prepare(`
    SELECT COUNT(*) as count FROM user_paths WHERE user_id = ? AND status = 'completed'
  `).get(userId);

  const milestones = [
    { count: 5, title: 'Dedicated Learner', desc: 'Completed 5 learning paths', icon: 'star' },
    { count: 10, title: 'Knowledge Seeker', desc: 'Completed 10 learning paths', icon: 'zap' },
    { count: 25, title: 'Path Master', desc: 'Completed 25 learning paths', icon: 'crown' },
    { count: 50, title: 'Enlightened One', desc: 'Completed 50 learning paths', icon: 'sun' },
  ];

  const newAchievements = [];
  
  for (const milestone of milestones) {
    if (pathCount.count >= milestone.count) {
      const existing = db.prepare(`
        SELECT id FROM achievements WHERE user_id = ? AND type = 'milestone_${milestone.count}'
      `).get(userId);
      
      if (!existing) {
        const achievement = createAchievement(
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

