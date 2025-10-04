import { SafeAreaView } from 'react-native-safe-area-context';
import CreatePostScreen from '../screens/CreatePostScreen';

export default function CreatePost() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CreatePostScreen />
    </SafeAreaView>
  );
}