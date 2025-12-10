import { PathStage, LearningPath } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('attentio_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface SavedPath {
  id: number;
  topic: string;
  totalStages: number;
  totalTopics: number;
  completedStages: number;
  completedTopics: number;
  status: 'active' | 'completed' | 'archived';
  startedAt: string;
  lastAccessedAt: string;
  completedAt: string | null;
  progress_percent: number;
  // New Duolingo-style fields
  totalUnits?: number;
  totalLevels?: number;
  totalLessons?: number;
  totalXp?: number;
  earnedXp?: number;
}

export interface PathWithProgress {
  id: number;
  topic: string;
  status: string;
  totalStages: number;
  totalTopics: number;
  completedStages: number;
  completedTopics: number;
  startedAt: string;
  lastAccessedAt: string;
  completedAt: string | null;
  pathData: PathStage[] | LearningPath; // Support both old and new formats
  progressMap: Record<string, {
    stage_index: number;
    item_type: string;
    item_index: number;
    is_completed: number;
    completed_at: string | null;
    notes: string | null;
  }>;
}

// Get all user's saved paths
export const getUserPaths = async (): Promise<SavedPath[]> => {
  const response = await fetch(`${API_URL}/paths`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch paths');
  }

  const data = await response.json();
  return data.paths;
};

// Get a specific path with progress
export const getPathWithProgress = async (pathId: number): Promise<PathWithProgress> => {
  const response = await fetch(`${API_URL}/paths/${pathId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch path');
  }

  return response.json();
};

// Save a new learning path (supports both old and new formats)
export const saveLearningPath = async (
  topic: string, 
  pathData: PathStage[] | LearningPath, 
  replace: boolean = false
): Promise<{ pathId: number; existingPathId?: number }> => {
  const response = await fetch(`${API_URL}/paths`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic, pathData, replace })
  });

  const data = await response.json();

  if (!response.ok) {
    // Return the existingPathId if there's a conflict
    if (response.status === 409 && data.existingPathId) {
      const error: any = new Error(data.error || 'Path already exists');
      error.existingPathId = data.existingPathId;
      throw error;
    }
    throw new Error(data.error || 'Failed to save path');
  }

  return data;
};

export interface NewAchievement {
  id: number;
  type: string;
  title: string;
  description: string;
  topic: string | null;
  icon: string;
}

export interface ProgressUpdateResult {
  completedTopics: number;
  completedStages: number;
  isFullyCompleted: boolean;
  newAchievements: NewAchievement[];
}

// Update progress on a path item
export const updatePathProgress = async (
  pathId: number,
  stageIndex: number,
  itemType: 'topic' | 'project' | 'resource' | 'stage',
  itemIndex: number,
  isCompleted: boolean,
  notes?: string
): Promise<ProgressUpdateResult> => {
  const response = await fetch(`${API_URL}/paths/${pathId}/progress`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ stageIndex, itemType, itemIndex, isCompleted, notes })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update progress');
  }

  return {
    ...data,
    newAchievements: data.newAchievements || []
  };
};

// Archive a path
export const archivePath = async (pathId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/paths/${pathId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to archive path');
  }
};

// Permanently delete a path
export const deletePath = async (pathId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/paths/${pathId}?permanent=true`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete path');
  }
};

// Restart a path
export const restartPath = async (pathId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/paths/${pathId}/restart`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to restart path');
  }
};

