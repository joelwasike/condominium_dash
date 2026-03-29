// Environment Configuration

export interface EnvConfig {
  API_BASE_URL: string;
  NODE_ENV: string;
  APP_NAME: string;
  VERSION: string;
}

export const ENV_CONFIG: EnvConfig = {
  // API Base URL - Change this when deploying to production
  API_BASE_URL: 'https://saafimmo-api.theliberec.com',

  // Environment
  NODE_ENV: 'production',

  // App Configuration
  APP_NAME: 'Real Estate Management System',
  VERSION: '1.0.0',
};

// Helper to check if we're in development
export const isDevelopment = (): boolean => ENV_CONFIG.NODE_ENV === 'development';

// Helper to check if we're in production
export const isProduction = (): boolean => ENV_CONFIG.NODE_ENV === 'production';
