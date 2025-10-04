import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import CreateScreen from '@/screens/CreateScreen';
import { COLORS } from '@/constants/theme';

export default function CreateRoute() {
  return (
    <SafeAreaView style={styles.container}>
      <CreateScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});