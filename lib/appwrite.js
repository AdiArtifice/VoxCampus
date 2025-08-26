import { Client, Account, ID } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
  .setPlatform('com.voxcampus.app');

// Create a single Account instance for the app
const account = new Account(client);

export { client, account, ID };
