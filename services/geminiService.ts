import { Resource, PathStage, LearningPath } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to parse duration
const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 60 + minutes + Math.ceil(seconds / 60);
};

// Helper to format view count
const formatViewCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
  return `${count} views`;
};

// --- Functions ---

export const fetchSearchSuggestions = async (topic: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URL}/ai/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("Suggestion Error:", error);
    return [];
  }
};

export const fetchQuickResources = async (topic: string): Promise<Resource[]> => {
  const resources: Resource[] = [];

  // Step 1: Fetch YouTube videos via backend proxy
  try {
    const ytResponse = await fetch(`${API_URL}/ai/youtube-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: topic, maxResults: 3 })
    });

    if (ytResponse.ok) {
      const ytData = await ytResponse.json();
      const videoResources = (ytData.videos || []).map((video: any) => ({
        title: video.title,
        type: 'Video',
        description: video.description.substring(0, 200) + (video.description.length > 200 ? '...' : ''),
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        views: formatViewCount(video.viewCount),
        viewCount: video.viewCount,
        publishedDate: video.publishedAt,
        durationMin: parseDuration(video.duration),
      }));
    resources.push(...videoResources);
    }
  } catch (error) {
    console.warn('YouTube fetch failed:', error);
  }

  // Step 2: Get AI-generated resources via backend proxy
  try {
    const response = await fetch(`${API_URL}/ai/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, hasYouTubeVideos: resources.length > 0 })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResources = data.resources || [];
      // Filter out videos if we already have YouTube videos
      const filtered = resources.length > 0
        ? aiResources.filter((r: Resource) => r.type !== 'Video')
        : aiResources;
      resources.push(...filtered);
    } else if (resources.length === 0) {
      throw new Error("Failed to fetch resources");
    }
  } catch (error) {
    console.error("Resources Error:", error);
    if (resources.length === 0) {
      throw new Error("Failed to fetch resources. Please try again.");
    }
  }

  return resources;
};

export const fetchLearningPath = async (topic: string): Promise<LearningPath> => {
  try {
    const response = await fetch(`${API_URL}/ai/learning-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to generate learning path');
    }

    const data = await response.json();
    return data.path;
  } catch (error: any) {
    console.error("Learning Path Error:", error);
    throw new Error(error.message || "Failed to generate learning path. Please try again.");
  }
};
