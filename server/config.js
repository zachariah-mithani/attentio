/**
 * Server configuration
 * Handles environment-specific settings
 */

import dotenv from 'dotenv';

dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

export const config = {
  // Environment
  isDev,
  isProd: !isDev,
  
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  
  // CORS origins
  corsOrigins: isDev 
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000']
    : (process.env.CORS_ORIGINS || 'https://learnlumina.xyz,https://www.learnlumina.xyz').split(',').filter(Boolean),
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || (isDev ? 'lumina-dev-secret' : undefined),
  jwtExpiresIn: '7d',
  
  // API Keys
  openRouterApiKey: process.env.API_KEY || '',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  
  // Rate limiting (requests per window)
  rateLimit: {
    general: isDev ? 1000 : 100,      // General API
    auth: isDev ? 100 : 10,           // Auth endpoints
    ai: isDev ? 100 : 10,             // AI endpoints
    pathGeneration: isDev ? 50 : 3,   // Path generation
  },
  
  // Rate limit window (ms)
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
};

// Validate required config in production
export const validateConfig = () => {
  const errors = [];
  
  if (config.isProd) {
    if (!config.jwtSecret) {
      errors.push('JWT_SECRET is required in production');
    }
    if (config.jwtSecret === 'lumina-dev-secret') {
      errors.push('JWT_SECRET must be changed from default in production');
    }
    if (!config.openRouterApiKey) {
      errors.push('API_KEY (OpenRouter) is required for AI features');
    }
    if (config.corsOrigins.length === 0) {
      errors.push('CORS_ORIGINS must be set in production');
    }
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    if (config.isProd) {
      process.exit(1);
    }
  }
  
  return errors.length === 0;
};

export default config;

