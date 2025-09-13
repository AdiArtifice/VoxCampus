import { NavigatorScreenParams } from '@react-navigation/native';

// Main Tab Navigator Params
export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Add: undefined;
  Connect: undefined;
  Associations: undefined;
  Profile: undefined;
};

// Root Navigator Params
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  PendingRequests: undefined;
  Auth: undefined;
  Profile: undefined;
  ClubDetails: { id: string; name: string };
  EventDetails: { id: string; title: string };
  CreatePost: undefined;
  'verify-email': { userId?: string; secret?: string };
  'auth-callback': undefined;
};

// Declare types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
