
export enum ViewMode {
  HOME = 'HOME',
  QUICK = 'QUICK',
  PATH = 'PATH',
  MY_PATHS = 'MY_PATHS',
  SAVED_PATH = 'SAVED_PATH',
  STATS = 'STATS'
}

export enum ResourceType {
  VIDEO = 'Video',
  ARTICLE = 'Article',
  COURSE = 'Course',
  BOOK = 'Book'
}

// Skill level determines course depth and difficulty
export type SkillLevel = 'curious' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillLevelConfig {
  id: SkillLevel;
  label: string;
  description: string;
  icon: string;
  units: { min: number; max: number };
  levelsPerUnit: { min: number; max: number };
  lessonsPerLevel: { min: number; max: number };
  estimatedHours: { min: number; max: number };
}

export const SKILL_LEVELS: SkillLevelConfig[] = [
  {
    id: 'curious',
    label: 'Just Curious',
    description: 'Quick overview to understand the basics',
    icon: '🌱',
    units: { min: 1, max: 2 },
    levelsPerUnit: { min: 2, max: 3 },
    lessonsPerLevel: { min: 2, max: 3 },
    estimatedHours: { min: 1, max: 3 },
  },
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Learn fundamentals and core concepts',
    icon: '📚',
    units: { min: 2, max: 3 },
    levelsPerUnit: { min: 3, max: 4 },
    lessonsPerLevel: { min: 3, max: 4 },
    estimatedHours: { min: 5, max: 10 },
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Build solid knowledge and practical skills',
    icon: '🚀',
    units: { min: 3, max: 4 },
    levelsPerUnit: { min: 4, max: 5 },
    lessonsPerLevel: { min: 4, max: 5 },
    estimatedHours: { min: 15, max: 25 },
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Master complex topics and techniques',
    icon: '⚡',
    units: { min: 4, max: 5 },
    levelsPerUnit: { min: 5, max: 6 },
    lessonsPerLevel: { min: 4, max: 5 },
    estimatedHours: { min: 30, max: 50 },
  },
  {
    id: 'expert',
    label: 'Expert',
    description: 'Comprehensive mastery of the subject',
    icon: '👑',
    units: { min: 5, max: 7 },
    levelsPerUnit: { min: 5, max: 7 },
    lessonsPerLevel: { min: 5, max: 6 },
    estimatedHours: { min: 50, max: 100 },
  },
];

export interface Resource {
  title: string;
  type: string; // "Video", "Article", "Course", "Podcast"
  description: string;
  url: string;

  // Metadata for sorting/filtering
  views: string; // Display string e.g., "1.2M views"
  viewCount: number; // Numeric for sorting
  publishedDate: string; // YYYY-MM-DD
  durationMin: number; // Minutes
  
  // Video-specific (for embedding)
  videoId?: string | null;
  thumbnailUrl?: string;
}

// ============================================
// DUOLINGO-STYLE STRUCTURE
// ============================================

// A single lesson (bite-sized, 3-5 minutes)
export interface Lesson {
  id: string;
  title: string;           // e.g., "What is a Variable?"
  description: string;     // Brief explanation of what you'll learn
  xpReward: number;        // XP earned for completion (typically 10-15)
  resource: Resource;      // The video/content for this lesson
}

// A level contains 3-5 lessons (like a Duolingo skill)
export interface Level {
  id: string;
  levelNumber: number;     // 1, 2, 3, etc.
  title: string;           // e.g., "Variables & Data Types"
  description: string;     // What this level covers
  icon: string;            // Emoji icon for the level
  lessons: Lesson[];       // 3-5 bite-sized lessons
  challengeProject?: string; // Optional mini-project after completing all lessons
  totalXp: number;         // Total XP available in this level
}

// A unit groups related levels (like a Duolingo unit/section)
export interface Unit {
  id: string;
  unitNumber: number;      // 1, 2, 3, etc.
  title: string;           // e.g., "Programming Fundamentals"
  description: string;     // Overview of the unit
  color: string;           // Theme color for the unit (hex)
  levels: Level[];         // 3-5 levels per unit
  bossChallenge?: string;  // Final challenge/project for the unit
}

// The complete learning path
export interface LearningPath {
  topic: string;
  skillLevel: SkillLevel;
  totalUnits: number;
  totalLevels: number;
  totalLessons: number;
  totalXp: number;
  estimatedHours: number;
  units: Unit[];
}

// ============================================
// LEGACY SUPPORT (for existing paths)
// ============================================

export interface KeyTopic {
  name: string;
  resource: Resource;
}

export interface PathStage {
  stageName: string;
  description: string;
  goal: string;
  keyTopics: KeyTopic[]; // Each topic has its own resource
  suggestedProject: string;
}

export interface AppState {
  mode: ViewMode;
  topic: string;
  isLoading: boolean;
  quickResources: Resource[];
  learningPath: PathStage[] | LearningPath; // Support both old and new formats
  error: string | null;
}
