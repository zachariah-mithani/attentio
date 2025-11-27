const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('lumina_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface Achievement {
  id: number;
  type: string;
  title: string;
  description: string;
  topic: string | null;
  icon: string;
  earned_at: string;
  path_id: number | null;
}

export interface AchievementStats {
  total_achievements: number;
  paths_completed: number;
  milestones: number;
}

// Get all user's achievements
export const getUserAchievements = async (): Promise<Achievement[]> => {
  const response = await fetch(`${API_URL}/achievements`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch achievements');
  }

  const data = await response.json();
  return data.achievements;
};

// Get achievement stats
export const getAchievementStats = async (): Promise<AchievementStats> => {
  const response = await fetch(`${API_URL}/achievements/stats`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch stats');
  }

  const data = await response.json();
  return data.stats;
};

// Icon mapping for achievements
export const getAchievementIcon = (icon: string): string => {
  const icons: Record<string, string> = {
    trophy: '🏆',
    rocket: '🚀',
    star: '⭐',
    zap: '⚡',
    crown: '👑',
    sun: '☀️',
    medal: '🎖️',
    fire: '🔥',
    gem: '💎',
    target: '🎯'
  };
  return icons[icon] || '🏆';
};

