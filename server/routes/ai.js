import { Router } from 'express';
import dotenv from 'dotenv';
import { pathGenerationLimiter } from '../middleware/rateLimiter.js';
import { validateTopic } from '../middleware/validation.js';

dotenv.config();

const router = Router();

const OPENROUTER_API_KEY = process.env.API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID = 'x-ai/grok-4.1-fast:free';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

// Helper to call OpenRouter
async function callOpenRouter(prompt) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://learnlumina.xyz',
      'X-Title': 'Lumina Focus Learning',
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter API Error:', errorData);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// POST /api/ai/suggestions - Get search suggestions
router.post('/suggestions', validateTopic, async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `Generate 5 trending, popular, or "hot" search queries related to the topic "${topic}" for the year 2025. 
Focus on recent news, current events, emerging trends, or highly popular specific aspects that people are currently interested in RIGHT NOW (2024-2025).

Example: "basketball" -> ["NBA Playoffs 2025 Predictions", "Lakers latest trade news 2025", "Top 10 Dunks this season", "LeBron James stats 2025"].

Return ONLY a valid JSON array of strings, no other text.`;

    const text = await callOpenRouter(prompt);
    if (!text) {
      return res.json({ suggestions: [] });
    }
    
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(jsonText);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.json({ suggestions: [] }); // Silent fail for suggestions
  }
});

// POST /api/ai/resources - Get quick resources
router.post('/resources', validateTopic, async (req, res) => {
  try {
    const { topic, hasYouTubeVideos } = req.body;

    const prompt = `Suggest ${hasYouTubeVideos ? '3-4' : '6'} high-quality learning resources (${hasYouTubeVideos ? 'Articles and Courses ONLY, NO VIDEOS' : 'Videos, Articles, and Courses'}) for "${topic}".
    
CRITICAL URL INSTRUCTIONS:
1. **ARTICLES**: Provide direct links to well-known, authoritative sources:
   - Technical topics: MDN Web Docs, official documentation, Wikipedia, major tech blogs
   - Science: NASA.gov, Nature.com, Scientific American
   - Business: Harvard Business Review, Forbes, McKinsey
   - General: Wikipedia, official organization websites

2. **COURSES**: Provide the MAIN LANDING PAGE for famous, stable courses:
   - Coursera, edX, freeCodeCamp, Udemy, Khan Academy

3. **VIDEOS** (if needed): Provide actual YouTube URLs with format https://www.youtube.com/watch?v=VIDEO_ID

4. Choose FAMOUS, WELL-ESTABLISHED resources where URLs are stable.

Return in this EXACT JSON format:
[{
  "title": "Resource Title",
  "type": "Article" or "Course" or "Video",
  "description": "Brief description",
  "url": "https://actual-url.com",
  "views": "1.5M views",
  "viewCount": 1500000,
  "publishedDate": "2024-01-15",
  "durationMin": 10
}]

Return ONLY the JSON array, no other text.`;

    const text = await callOpenRouter(prompt);
    if (!text) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }
    
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const resources = JSON.parse(jsonText);
    
    res.json({ resources });
  } catch (error) {
    console.error('Resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// POST /api/ai/learning-path - Generate learning path (with stricter rate limit)
router.post('/learning-path', pathGenerationLimiter, validateTopic, async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `Create a comprehensive, structured learning path for "${topic}".
  
  DYNAMIC LENGTH INSTRUCTION:
  - If the topic is BROAD (e.g., "Computer Science", "History", "Physics"), generate 5-7 stages to cover it properly.
  - If the topic is SPECIFIC (e.g., "React Hooks", "Making Sourdough"), generate 3-4 stages.
  
  For EACH stage, you MUST provide 2-3 specific learning resources (Videos or Courses).

  Return ONLY a valid JSON array of objects, each containing:
  - stageName (string): e.g., "Foundations", "Core Concepts", "Advanced Techniques"
  - description (string): brief description of this stage
  - goal (string): learning goal for this stage
  - keyTopics (array of strings): 3-5 key topics to learn
  - suggestedProject (string): a hands-on project for this stage
  - resources (array of objects): 2-3 specific resources for this stage.
    - title: Resource Title
    - type: "Video" or "Course"
    - description: Brief reason why this is good
    - url: "https://actual-url.com" (Use real, stable URLs like Coursera, edX, YouTube)
    - views: "1M views" (estimate)
    - viewCount: 1000000 (estimate number)
    - publishedDate: "2024-01-01" (estimate)
    - durationMin: 10 (estimate)

  Return ONLY the JSON array, no other text.`;

    const text = await callOpenRouter(prompt);
    
    if (!text || text.trim().length === 0) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }
    
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const path = JSON.parse(jsonText);
    
    res.json({ path });
  } catch (error) {
    console.error('Learning path error:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// POST /api/ai/youtube-search - Search YouTube videos
router.post('/youtube-search', async (req, res) => {
  try {
    const { query, maxResults = 3 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    if (!YOUTUBE_API_KEY) {
      return res.json({ videos: [] }); // Silent fail if no API key
    }

    // Step 1: Search for videos
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      videoDuration: 'medium',
      key: YOUTUBE_API_KEY,
    });

    const searchResponse = await fetch(`${YOUTUBE_SEARCH_URL}?${searchParams}`);
    
    if (!searchResponse.ok) {
      if (searchResponse.status === 403) {
        console.warn('YouTube API quota exceeded');
        return res.json({ videos: [] });
      }
      throw new Error('YouTube search failed');
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map(item => item.id.videoId);

    if (videoIds.length === 0) {
      return res.json({ videos: [] });
    }

    // Step 2: Get detailed video statistics
    const videosParams = new URLSearchParams({
      part: 'contentDetails,statistics,snippet',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY,
    });

    const videosResponse = await fetch(`${YOUTUBE_VIDEOS_URL}?${videosParams}`);
    
    if (!videosResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const videosData = await videosResponse.json();

    const videos = videosData.items.map(item => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt.split('T')[0],
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      viewCount: parseInt(item.statistics.viewCount || '0', 10),
      duration: item.contentDetails.duration,
    }));

    res.json({ videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.json({ videos: [] }); // Silent fail
  }
});

export default router;

