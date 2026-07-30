
export interface EnvConfig {
  API_BASE_URL: string;
  NODE_ENV: string;
  APP_NAME: string;
  VERSION: string;
}

export const ENV_CONFIG: EnvConfig = {
  API_BASE_URL: 'https://saafimmo-api.theliberec.com',
  NODE_ENV: 'production',
  APP_NAME: 'Real Estate Management System',
  VERSION: '1.0.0'
};
export const isDevelopment = (): boolean => ENV_CONFIG.NODE_ENV === 'development';
export const isProduction = (): boolean => ENV_CONFIG.NODE_ENV === 'production';
