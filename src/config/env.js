// Environment Configuration
export const ENV_CONFIG = {
  // API Base URL - Change this when deploying to production
  API_BASE_URL: 'http://localhost:8080',
  
  // Environment
  NODE_ENV: 'development',
  
  // App Configuration
  APP_NAME: 'Real Estate Management System',
  VERSION: '1.0.0',
};

// Helper to check if we're in development
export const isDevelopment = () => ENV_CONFIG.NODE_ENV === 'development';

// Helper to check if we're in production
export const isProduction = () => ENV_CONFIG.NODE_ENV === 'production';
