import { Client, Account, ID, Databases, Storage, Query } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setPlatform('com.voxcampus.app');

// Create a single Account instance for the app
const account = new Account(client);

// Databases & Storage instances
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage, ID, Query };
