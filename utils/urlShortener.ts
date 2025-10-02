import { Client, Functions } from 'appwrite';
import { config } from '../constants/environment';

// Appwrite client for URL shortening
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

const functions = new Functions(client);

export interface ShortenUrlResponse {
  success: boolean;
  shortUrl?: string;
  originalUrl: string;
  error?: string;
}

/**
 * Shortens a URL using Appwrite Functions
 * @param url - The full URL to shorten
 * @returns Promise<ShortenUrlResponse>
 */
export const shortenUrl = async (url: string): Promise<ShortenUrlResponse> => {
  try {
    const functionId = process.env.EXPO_PUBLIC_URL_SHORTENER_FUNCTION_ID || 'url-shortener';
    
    // Call the URL shortener function
    const response = await functions.createExecution(
      functionId,
      JSON.stringify({ url }),
      false, // async
      '/',
      undefined, // method - let Appwrite handle the default
      { 'Content-Type': 'application/json' }
    );

    if (response.responseStatusCode === 200) {
      const result = JSON.parse(response.responseBody);
      
      if (result.success && result.shortUrl) {
        return {
          success: true,
          shortUrl: result.shortUrl,
          originalUrl: url,
        };
      }
    }

    // If function call succeeded but didn't return a short URL, return original
    console.warn('URL shortener function did not return a short URL, using original');
    return {
      success: false,
      originalUrl: url,
      error: 'URL shortener service unavailable',
    };

  } catch (error) {
    console.warn('Error shortening URL:', error);
    // Return original URL if shortening fails
    return {
      success: false,
      originalUrl: url,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Generates a shareable URL for a post with optional shortening
 * @param postId - The ID of the post to share
 * @param useShortening - Whether to attempt URL shortening (default: true in production)
 * @returns Promise<string> - The shareable URL
 */
export const generateShareableUrl = async (
  postId: string, 
  useShortening: boolean = config.isProduction
): Promise<string> => {
  // Always use production URL for sharing so recipients can access it
  const productionBaseUrl = process.env.EXPO_PUBLIC_PRODUCTION_BASE_URL || 'https://voxcampusorg.appwrite.network';
  const fullUrl = `${productionBaseUrl}/post/${postId}`;
  
  console.log('Generating shareable URL:', {
    postId,
    fullUrl,
    useShortening,
    environment: config.environment
  });
  
  // If shortening is disabled, return production URL
  if (!useShortening) {
    return fullUrl;
  }

  try {
    // Attempt to shorten the URL
    const result = await shortenUrl(fullUrl);
    
    // Return short URL if successful, otherwise return full URL
    return result.shortUrl || result.originalUrl;
  } catch (error) {
    console.warn('Failed to shorten URL, using full URL:', error);
    return fullUrl;
  }
};

/**
 * Utility to validate if a URL is properly formatted
 * @param url - URL to validate
 * @returns boolean
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Extracts post ID from a shareable URL
 * @param url - The shareable URL
 * @returns string | null - The post ID if found
 */
export const extractPostIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const postIndex = pathSegments.indexOf('post');
    
    if (postIndex !== -1 && postIndex + 1 < pathSegments.length) {
      return pathSegments[postIndex + 1];
    }
    
    return null;
  } catch {
    return null;
  }
};