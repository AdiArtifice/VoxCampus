import React from 'react';
import RootNavigator from '@/navigation/RootNavigator';
import AnimatedSplash from '@/components/AnimatedSplash';
import { View } from 'react-native';

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
      {showSplash && (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      )}
    </View>
  );
}
