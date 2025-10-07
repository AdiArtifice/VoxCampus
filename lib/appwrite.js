import { Client, Account, ID, Databases, Storage, Query, Permission, Role } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

// Only set platform for native environments. On web, this is not required and can cause issues.
try {
  // eslint-disable-next-line no-undef
  const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
  if (!isWeb) {
    client.setPlatform('com.voxcampus.app');
  }
} catch {
  // noop
}

// Create a single Account instance for the app
const account = new Account(client);

// Databases & Storage instances
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage, ID, Query, Permission, Role };
