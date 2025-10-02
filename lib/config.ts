// Central Appwrite config for Expo Web + Native
// Prefer reading EXPO_PUBLIC_* at build time; provide safe fallbacks and runtime assertions

export const APPWRITE = {
  DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? '',
  POSTS_COLLECTION_ID: process.env.EXPO_PUBLIC_APPWRITE_POSTS_COLLECTION_ID ?? 'events_and_sessions',
};

export function assertConfig() {
  if (!APPWRITE.DATABASE_ID) {
    console.error('Missing EXPO_PUBLIC_APPWRITE_DATABASE_ID');
  }
}

// Backwards compatibility for existing imports
export const APPWRITE_CONFIG = {
  DATABASE_ID: APPWRITE.DATABASE_ID || '68c58e83000a2666b4d9',
  COLLECTION_ID: APPWRITE.POSTS_COLLECTION_ID,
};

export type AppwriteConfig = typeof APPWRITE_CONFIG;
