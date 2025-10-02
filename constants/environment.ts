import Constants from 'expo-constants';

// Environment types
export type Environment = 'development' | 'production' | 'preview';

// Environment configuration interface
interface EnvironmentConfig {
  baseUrl: string;
  shareBaseUrl: string; // Always production URL for sharing
  apiUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  environment: Environment;
}

// Get current environment
export const getCurrentEnvironment = (): Environment => {
  if (__DEV__) {
    return 'development';
  }
  
  // Check if we're in Expo Go or preview build
  if (Constants.appOwnership === 'expo') {
    return 'preview';
  }
  
  return 'production';
};

// Get environment configuration
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = getCurrentEnvironment();
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  
  // For sharing, ALWAYS use production URLs so recipients can access them
  const shareBaseUrl = process.env.EXPO_PUBLIC_PRODUCTION_BASE_URL || 'https://voxcampusorg.appwrite.network';
  
  // For internal navigation, use appropriate URL based on environment
  const baseUrl = isDevelopment 
    ? (process.env.EXPO_PUBLIC_LOCAL_BASE_URL || 'http://localhost:19006')
    : shareBaseUrl;

  const config: EnvironmentConfig = {
    baseUrl,
    shareBaseUrl, // Always production for sharing
    apiUrl: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
    isProduction,
    isDevelopment,
    environment,
  };

  console.log('Environment Config:', {
    environment,
    baseUrl: config.baseUrl,
    shareBaseUrl: config.shareBaseUrl,
    isDevelopment,
    isProduction,
  });

  return config;
};

// Convenience exports
export const config = getEnvironmentConfig();
export const isProduction = config.isProduction;
export const isDevelopment = config.isDevelopment;

// Environment-aware URL builders
export const buildPostUrl = (postId: string, forSharing: boolean = false): string => {
  const envConfig = getEnvironmentConfig();
  
  // Use production URL for sharing, local URL for internal navigation
  const baseUrl = forSharing ? envConfig.shareBaseUrl : envConfig.baseUrl;
  
  return `${baseUrl}/post/${postId}`;
};

// Always return production URL for sharing so recipients can access it
export const buildShareablePostUrl = (postId: string): string => {
  const productionBaseUrl = process.env.EXPO_PUBLIC_PRODUCTION_BASE_URL || 'https://voxcampusorg.appwrite.network';
  return `${productionBaseUrl}/post/${postId}`;
};

// Debug information
export const getEnvironmentInfo = () => ({
  environment: getCurrentEnvironment(),
  config: getEnvironmentConfig(),
  constants: {
    appOwnership: Constants.appOwnership,
    isDev: __DEV__,
    platform: Constants.platform,
  },
});