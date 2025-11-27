
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

export interface Resource {
  title: string;
  type: string; // "Video", "Article", "Course"
  description: string;
  url: string;

  // Metadata for sorting/filtering
  views: string; // Display string e.g., "1.2M views"
  viewCount: number; // Numeric for sorting
  publishedDate: string; // YYYY-MM-DD
  durationMin: number; // Minutes
}

export interface PathStage {
  stageName: string;
  description: string;
  goal: string;
  keyTopics: string[];
  suggestedProject: string;
  resources: Resource[]; // Recommended resources for this stage
}

export interface AppState {
  mode: ViewMode;
  topic: string;
  isLoading: boolean;
  quickResources: Resource[];
  learningPath: PathStage[];
  error: string | null;
}
