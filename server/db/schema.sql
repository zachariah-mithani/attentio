-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- User sessions (for tracking/invalidation if needed)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved learning paths
CREATE TABLE IF NOT EXISTS user_paths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  path_data TEXT NOT NULL,  -- JSON string of the full path stages
  total_stages INTEGER NOT NULL,
  total_topics INTEGER NOT NULL,
  completed_stages INTEGER DEFAULT 0,
  completed_topics INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',  -- 'active', 'completed', 'archived'
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_paths_user ON user_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_user_paths_status ON user_paths(status);

-- Progress tracking for individual items within a path
CREATE TABLE IF NOT EXISTS path_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  stage_index INTEGER NOT NULL,
  item_type TEXT NOT NULL,  -- 'topic', 'project', 'resource'
  item_index INTEGER NOT NULL,  -- index within the stage
  is_completed INTEGER DEFAULT 0,
  completed_at DATETIME,
  notes TEXT,  -- user notes for this item
  FOREIGN KEY (path_id) REFERENCES user_paths(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(path_id, stage_index, item_type, item_index)
);

CREATE INDEX IF NOT EXISTS idx_path_progress_path ON path_progress(path_id);
CREATE INDEX IF NOT EXISTS idx_path_progress_user ON path_progress(user_id);

-- User achievements
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  path_id INTEGER,
  type TEXT NOT NULL,  -- 'path_completion', 'first_path', 'streak', etc.
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  icon TEXT DEFAULT 'trophy',  -- icon identifier
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (path_id) REFERENCES user_paths(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);

