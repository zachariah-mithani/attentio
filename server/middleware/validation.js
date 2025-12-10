/**
 * Input validation and sanitization middleware
 */

// Sanitize string input - remove potential XSS
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 1000); // Limit length
};

// Sanitize email
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().substring(0, 254);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate username format
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Validate password strength
export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
};

// Validate topic/search query
export const isValidTopic = (topic) => {
  return typeof topic === 'string' && topic.trim().length >= 2 && topic.trim().length <= 200;
};

// Middleware to validate auth registration
export const validateRegistration = (req, res, next) => {
  const { email, username, password } = req.body;

  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!username || !isValidUsername(username)) {
    errors.push('Username must be 3-20 characters, alphanumeric and underscores only');
  }

  if (!password || !isValidPassword(password)) {
    errors.push('Password must be 6-128 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  // Sanitize inputs
  req.body.email = sanitizeEmail(email);
  req.body.username = sanitizeString(username).toLowerCase();

  next();
};

// Middleware to validate login
export const validateLogin = (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || typeof identifier !== 'string' || identifier.trim().length < 3) {
    return res.status(400).json({ error: 'Email or username required' });
  }

  if (!password || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Valid password required' });
  }

  req.body.identifier = sanitizeString(identifier).toLowerCase();

  next();
};

// Middleware to validate topic/search input
export const validateTopic = (req, res, next) => {
  const { topic, query } = req.body;
  const input = topic || query;

  if (!input || !isValidTopic(input)) {
    return res.status(400).json({ error: 'Valid topic required (2-200 characters)' });
  }

  if (topic) req.body.topic = sanitizeString(topic);
  if (query) req.body.query = sanitizeString(query);

  next();
};

// Helper to check if path data is new Duolingo-style format
const isNewPathFormat = (pathData) => {
  return pathData && typeof pathData === 'object' && 'units' in pathData && Array.isArray(pathData.units);
};

// Middleware to validate path data (supports both old and new formats)
export const validatePathData = (req, res, next) => {
  const { topic, pathData } = req.body;

  if (!topic || !isValidTopic(topic)) {
    return res.status(400).json({ error: 'Valid topic required' });
  }

  if (!pathData) {
    return res.status(400).json({ error: 'Valid path data required' });
  }

  // Check for new Duolingo-style format
  if (isNewPathFormat(pathData)) {
    // Validate new format structure
    if (pathData.units.length === 0) {
      return res.status(400).json({ error: 'Path must have at least one unit' });
    }
    
    for (const unit of pathData.units) {
      if (!unit.title || !unit.levels || !Array.isArray(unit.levels) || unit.levels.length === 0) {
        return res.status(400).json({ error: 'Invalid unit structure' });
      }
      
      for (const level of unit.levels) {
        if (!level.title || !level.lessons || !Array.isArray(level.lessons) || level.lessons.length === 0) {
          return res.status(400).json({ error: 'Invalid level structure' });
        }
      }
    }
    
    req.body.topic = sanitizeString(topic);
    req.body.isNewFormat = true;
    return next();
  }
  
  // Validate old format (array of stages)
  if (!Array.isArray(pathData) || pathData.length === 0) {
    return res.status(400).json({ error: 'Valid path data required' });
  }

  // Basic validation of path structure
  for (const stage of pathData) {
    if (!stage.stageName || !stage.keyTopics || !Array.isArray(stage.keyTopics)) {
      return res.status(400).json({ error: 'Invalid path stage structure' });
    }
  }

  req.body.topic = sanitizeString(topic);
  req.body.isNewFormat = false;

  next();
};

// Middleware to validate progress update
export const validateProgressUpdate = (req, res, next) => {
  const { stageIndex, itemType, itemIndex, isCompleted } = req.body;

  if (typeof stageIndex !== 'number' || stageIndex < 0) {
    return res.status(400).json({ error: 'Valid stage index required' });
  }

  if (!['topic', 'project', 'resource', 'stage'].includes(itemType)) {
    return res.status(400).json({ error: 'Valid item type required' });
  }

  if (typeof itemIndex !== 'number' || itemIndex < 0) {
    return res.status(400).json({ error: 'Valid item index required' });
  }

  if (typeof isCompleted !== 'boolean') {
    return res.status(400).json({ error: 'Completion status required' });
  }

  next();
};

