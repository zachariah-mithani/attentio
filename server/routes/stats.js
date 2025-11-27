import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public stats (anyone can view)
router.get('/public', (req, res) => {
  try {
    // Get user and path stats
    const dbStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM user_paths) as total_paths,
        (SELECT COUNT(*) FROM user_paths WHERE status = 'completed') as completed_paths,
        (SELECT COUNT(*) FROM user_paths WHERE status = 'active') as active_paths,
        (SELECT COUNT(*) FROM achievements) as total_achievements
    `).get();

    // Get site-wide counters (ensure table exists)
    let siteStats = { quick_dive_searches: 0, paths_generated: 0 };
    try {
      siteStats = db.prepare('SELECT quick_dive_searches, paths_generated FROM site_stats WHERE id = 1').get() || siteStats;
    } catch (e) {
      // Table may not exist yet, use defaults
    }

    res.json({
      users: dbStats.total_users,
      quickDiveSearches: siteStats.quick_dive_searches,
      pathsGenerated: siteStats.paths_generated,
      pathsStarted: dbStats.total_paths,
      pathsCompleted: dbStats.completed_paths,
      achievements: dbStats.total_achievements
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Detailed stats (requires auth - for admin use)
router.get('/detailed', authMiddleware, (req, res) => {
  try {
    // User stats
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as last_7d,
        COUNT(CASE WHEN created_at > datetime('now', '-30 days') THEN 1 END) as last_30d
      FROM users
    `).get();

    // Path stats
    const pathStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        AVG(CASE WHEN total_topics > 0 THEN (completed_topics * 100.0 / total_topics) END) as avg_progress
      FROM user_paths
    `).get();

    // Recent signups
    const recentUsers = db.prepare(`
      SELECT username, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    // Top topics
    const topTopics = db.prepare(`
      SELECT topic, COUNT(*) as count
      FROM user_paths
      GROUP BY topic
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json({
      users: {
        total: userStats.total,
        last24h: userStats.last_24h,
        last7d: userStats.last_7d,
        last30d: userStats.last_30d,
        recent: recentUsers
      },
      paths: {
        total: pathStats.total,
        completed: pathStats.completed,
        active: pathStats.active,
        avgProgress: Math.round(pathStats.avg_progress || 0)
      },
      topTopics
    });
  } catch (error) {
    console.error('Detailed stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

