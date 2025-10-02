// Central Appwrite config with safe fallbacks for web builds
// If EXPO_PUBLIC_* envs are not injected at build time, these ensure the app still works

export const APPWRITE_CONFIG = {
  DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '68c58e83000a2666b4d9',
  COLLECTION_ID: 'events_and_sessions',
};

export type AppwriteConfig = typeof APPWRITE_CONFIG;
