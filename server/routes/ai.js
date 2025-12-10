import { Router } from 'express';
import dotenv from 'dotenv';
import { pathGenerationLimiter } from '../middleware/rateLimiter.js';
import { validateTopic } from '../middleware/validation.js';
import supabase from '../db/index.js';

dotenv.config();

const router = Router();

// Helper to increment site stats
async function incrementStat(field) {
  try {
    // First get current value
    const { data } = await supabase
      .from('site_stats')
      .select(field)
      .eq('id', 1)
      .single();
    
    const currentValue = data?.[field] || 0;
    
    // Update with incremented value
    await supabase
      .from('site_stats')
      .update({ 
        [field]: currentValue + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
  } catch (error) {
    console.error(`Failed to increment ${field}:`, error);
  }
}

const OPENROUTER_API_KEY = process.env.API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_ID = 'google/gemma-3n-e4b-it:free'; // Updated: grok model was removed from OpenRouter

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
      'HTTP-Referer': 'https://attentiolearn.xyz',
      'X-Title': 'Attentio Focus Learning',
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
    
    // Track Quick Dive search
    await incrementStat('quick_dive_searches');
    
    res.json({ resources });
  } catch (error) {
    console.error('Resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Helper to search YouTube for a single video
async function searchYouTubeVideo(query) {
  if (!YOUTUBE_API_KEY) return null;
  
  try {
    // Search for educational videos
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: `${query} tutorial OR explained OR learn`,
      type: 'video',
      maxResults: '1',
      order: 'relevance',
      videoDuration: 'medium',
      videoEmbeddable: 'true',
      key: YOUTUBE_API_KEY,
    });

    const searchResponse = await fetch(`${YOUTUBE_SEARCH_URL}?${searchParams}`);
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    if (!searchData.items || searchData.items.length === 0) return null;

    const videoId = searchData.items[0].id.videoId;

    // Get video details
    const videosParams = new URLSearchParams({
      part: 'contentDetails,statistics,snippet',
      id: videoId,
      key: YOUTUBE_API_KEY,
    });

    const videosResponse = await fetch(`${YOUTUBE_VIDEOS_URL}?${videosParams}`);
    if (!videosResponse.ok) return null;

    const videosData = await videosResponse.json();
    if (!videosData.items || videosData.items.length === 0) return null;

    const item = videosData.items[0];
    
    // Parse duration (PT1H2M3S -> minutes)
    const durationMatch = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(durationMatch?.[1] || '0', 10);
    const minutes = parseInt(durationMatch?.[2] || '0', 10);
    const seconds = parseInt(durationMatch?.[3] || '0', 10);
    const durationMin = hours * 60 + minutes + Math.ceil(seconds / 60);

    // Format view count
    const viewCount = parseInt(item.statistics.viewCount || '0', 10);
    let views;
    if (viewCount >= 1000000) views = `${(viewCount / 1000000).toFixed(1)}M views`;
    else if (viewCount >= 1000) views = `${(viewCount / 1000).toFixed(1)}K views`;
    else views = `${viewCount} views`;

    return {
      title: item.snippet.title,
      type: 'Video',
      description: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      videoId: videoId,
      views,
      viewCount,
      publishedDate: item.snippet.publishedAt.split('T')[0],
      durationMin,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
    };
  } catch (error) {
    console.error('YouTube search error for:', query, error);
    return null;
  }
}

// Skill level configurations
const SKILL_CONFIGS = {
  curious: {
    units: { min: 1, max: 2 },
    levelsPerUnit: { min: 2, max: 3 },
    lessonsPerLevel: { min: 2, max: 3 },
    estimatedHours: { min: 1, max: 3 },
    difficulty: 'very basic overview',
    depth: 'surface-level introduction',
  },
  beginner: {
    units: { min: 2, max: 3 },
    levelsPerUnit: { min: 3, max: 4 },
    lessonsPerLevel: { min: 3, max: 4 },
    estimatedHours: { min: 5, max: 10 },
    difficulty: 'beginner-friendly fundamentals',
    depth: 'solid foundation with core concepts',
  },
  intermediate: {
    units: { min: 3, max: 4 },
    levelsPerUnit: { min: 4, max: 5 },
    lessonsPerLevel: { min: 4, max: 5 },
    estimatedHours: { min: 15, max: 25 },
    difficulty: 'intermediate with practical applications',
    depth: 'comprehensive coverage with real-world skills',
  },
  advanced: {
    units: { min: 4, max: 5 },
    levelsPerUnit: { min: 5, max: 6 },
    lessonsPerLevel: { min: 4, max: 5 },
    estimatedHours: { min: 30, max: 50 },
    difficulty: 'advanced techniques and complex topics',
    depth: 'deep expertise with nuanced understanding',
  },
  expert: {
    units: { min: 5, max: 7 },
    levelsPerUnit: { min: 5, max: 7 },
    lessonsPerLevel: { min: 5, max: 6 },
    estimatedHours: { min: 50, max: 100 },
    difficulty: 'expert-level mastery',
    depth: 'comprehensive mastery including edge cases, history, and cutting-edge developments',
  },
};

// POST /api/ai/learning-path - Generate learning path (with stricter rate limit)
router.post('/learning-path', pathGenerationLimiter, validateTopic, async (req, res) => {
  try {
    const { topic, skillLevel = 'beginner' } = req.body;
    
    // Get config for skill level
    const config = SKILL_CONFIGS[skillLevel] || SKILL_CONFIGS.beginner;

    // Step 1: Generate Duolingo-style learning path structure with AI
    const prompt = `Create a comprehensive DUOLINGO-STYLE learning path for "${topic}" at the ${skillLevel.toUpperCase()} level.

TARGET SKILL LEVEL: ${skillLevel.toUpperCase()}
- Difficulty: ${config.difficulty}
- Depth: ${config.depth}
- Estimated learning time: ${config.estimatedHours.min}-${config.estimatedHours.max} hours

REQUIRED STRUCTURE:
- Generate ${config.units.min}-${config.units.max} UNITS (major sections/modules)
- Each unit MUST have ${config.levelsPerUnit.min}-${config.levelsPerUnit.max} LEVELS (skills to master)
- Each level MUST have ${config.lessonsPerLevel.min}-${config.lessonsPerLevel.max} LESSONS (individual video lessons)

UNIT DESIGN:
- Units should cover distinct major areas of the topic
- Progress from foundational to more advanced within the path
- Each unit builds on knowledge from previous units

LEVEL DESIGN:
- Each level focuses on a specific skill or concept cluster
- Levels within a unit progress in difficulty
- Include a practical challenge project for each level

LESSON DESIGN:
- Each lesson = ONE focused concept (3-10 minute video)
- Lessons should be ATOMIC - teach one thing well
- Use engaging, curiosity-sparking titles
- Progress logically within each level

Return ONLY a valid JSON object with this EXACT structure:
{
  "topic": "${topic}",
  "units": [
    {
      "unitNumber": 1,
      "title": "Unit Title",
      "description": "What this unit covers (1-2 sentences)",
      "color": "#hexcolor",
      "levels": [
        {
          "levelNumber": 1,
          "title": "Level Title",
          "description": "What you'll learn (1 sentence)",
          "icon": "emoji",
          "lessons": [
            {
              "title": "Lesson Title",
              "description": "One sentence about this lesson",
              "searchQuery": "specific YouTube search query"
            }
          ],
          "challengeProject": "Hands-on project description"
        }
      ],
      "bossChallenge": "Major project combining all unit skills"
    }
  ]
}

CRITICAL RULES:
1. MUST generate the exact number of units, levels, and lessons specified above
2. searchQuery should be VERY SPECIFIC for YouTube (e.g., "${topic} basics tutorial for beginners")
3. Colors: use vibrant, distinct hex colors (#10b981, #8b5cf6, #f59e0b, #3b82f6, #ef4444, #ec4899)
4. Icons: use relevant emojis (🎯 🔥 💡 🚀 ⚡ 🎨 🔧 📚 🧠 💪 🌟 🎓 🔬 🎪)
5. Make content progressively more ${skillLevel === 'curious' ? 'interesting' : skillLevel === 'expert' ? 'specialized and nuanced' : 'challenging'}

Return ONLY the JSON object, no markdown, no explanation.`;

    const text = await callOpenRouter(prompt);
    
    if (!text || text.trim().length === 0) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }
    
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const rawPath = JSON.parse(jsonText);
    
    // Step 2: Fetch real YouTube videos for each lesson
    let totalLessons = 0;
    let totalLevels = 0;
    let totalXp = 0;
    let totalDurationMin = 0;
    
    const units = await Promise.all(rawPath.units.map(async (unit, unitIndex) => {
      const levels = await Promise.all(unit.levels.map(async (level, levelIndex) => {
        totalLevels++;
        
        const lessons = await Promise.all(level.lessons.map(async (lesson, lessonIndex) => {
          totalLessons++;
          const xpReward = 10 + Math.floor(Math.random() * 6); // 10-15 XP per lesson
          totalXp += xpReward;
          
          // Search YouTube for this specific lesson
          const video = await searchYouTubeVideo(lesson.searchQuery || `${topic} ${lesson.title}`);
          
          if (video && video.durationMin) {
            totalDurationMin += video.durationMin;
          } else {
            totalDurationMin += 7; // Estimate 7 min per lesson if no video found
          }
          
          return {
            id: `u${unitIndex + 1}-l${levelIndex + 1}-s${lessonIndex + 1}`,
            title: lesson.title,
            description: lesson.description,
            xpReward,
            resource: video || {
              title: `Search: ${lesson.title}`,
              type: 'Video',
              description: 'Search YouTube for this topic',
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.searchQuery || topic + ' ' + lesson.title)}`,
              videoId: null,
              views: '-',
              viewCount: 0,
              publishedDate: '-',
              durationMin: 0,
            }
          };
        }));
        
        const levelTotalXp = lessons.reduce((sum, l) => sum + l.xpReward, 0);
        
        return {
          id: `u${unitIndex + 1}-l${levelIndex + 1}`,
          levelNumber: level.levelNumber || levelIndex + 1,
          title: level.title,
          description: level.description,
          icon: level.icon || '📚',
          lessons,
          challengeProject: level.challengeProject,
          totalXp: levelTotalXp,
        };
      }));
      
      return {
        id: `u${unitIndex + 1}`,
        unitNumber: unit.unitNumber || unitIndex + 1,
        title: unit.title,
        description: unit.description,
        color: unit.color || '#10b981',
        levels,
        bossChallenge: unit.bossChallenge,
      };
    }));
    
    // Calculate estimated hours (video time + practice time)
    const estimatedHours = Math.round((totalDurationMin / 60) * 1.5); // 1.5x for practice
    
    const learningPath = {
      topic: rawPath.topic || topic,
      skillLevel,
      totalUnits: units.length,
      totalLevels,
      totalLessons,
      totalXp,
      estimatedHours: Math.max(estimatedHours, config.estimatedHours.min),
      units,
    };
    
    // Track path generation
    await incrementStat('paths_generated');
    
    res.json({ path: learningPath });
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
