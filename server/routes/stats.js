import { Router } from 'express';
import supabase from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public stats (anyone can view)
router.get('/public', async (req, res) => {
  try {
    // Get user count
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get path stats
    const { data: allPaths } = await supabase
      .from('user_paths')
      .select('status');

    const totalPaths = allPaths?.length || 0;
    const completedPaths = allPaths?.filter(p => p.status === 'completed').length || 0;

    // Get achievement count
    const { count: achievementCount } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true });

    // Get site-wide counters
    const { data: siteStats } = await supabase
      .from('site_stats')
      .select('quick_dive_searches, paths_generated')
      .eq('id', 1)
      .single();

    res.json({
      users: userCount || 0,
      quickDiveSearches: siteStats?.quick_dive_searches || 0,
      pathsGenerated: siteStats?.paths_generated || 0,
      pathsStarted: totalPaths,
      pathsCompleted: completedPaths,
      achievements: achievementCount || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Detailed stats (requires auth - for admin use)
router.get('/detailed', authMiddleware, async (req, res) => {
  try {
    // User stats
    const { data: users } = await supabase
      .from('users')
      .select('created_at');

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const userStats = {
      total: users?.length || 0,
      last_24h: users?.filter(u => new Date(u.created_at) > oneDayAgo).length || 0,
      last_7d: users?.filter(u => new Date(u.created_at) > oneWeekAgo).length || 0,
      last_30d: users?.filter(u => new Date(u.created_at) > oneMonthAgo).length || 0
    };

    // Path stats
    const { data: paths } = await supabase
      .from('user_paths')
      .select('status, total_topics, completed_topics');

    const pathStats = {
      total: paths?.length || 0,
      completed: paths?.filter(p => p.status === 'completed').length || 0,
      active: paths?.filter(p => p.status === 'active').length || 0,
      avg_progress: 0
    };

    if (paths && paths.length > 0) {
      const progressSum = paths.reduce((sum, p) => {
        if (p.total_topics > 0) {
          return sum + (p.completed_topics * 100 / p.total_topics);
        }
        return sum;
      }, 0);
      pathStats.avg_progress = Math.round(progressSum / paths.length);
    }

    // Recent signups
    const { data: recentUsers } = await supabase
      .from('users')
      .select('username, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Top topics
    const { data: topicsData } = await supabase
      .from('user_paths')
      .select('topic');

    const topicCounts = {};
    (topicsData || []).forEach(p => {
      topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      users: {
        total: userStats.total,
        last24h: userStats.last_24h,
        last7d: userStats.last_7d,
        last30d: userStats.last_30d,
        recent: recentUsers || []
      },
      paths: {
        total: pathStats.total,
        completed: pathStats.completed,
        active: pathStats.active,
        avgProgress: pathStats.avg_progress
      },
      topTopics
    });
  } catch (error) {
    console.error('Detailed stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
