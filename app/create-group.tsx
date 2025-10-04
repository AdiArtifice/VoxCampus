import { SafeAreaView } from 'react-native-safe-area-context';
import CreateGroupScreen from '../screens/CreateGroupScreen';

export default function CreateGroup() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <CreateGroupScreen />
    </SafeAreaView>
  );
}