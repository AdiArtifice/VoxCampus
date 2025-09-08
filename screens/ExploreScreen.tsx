import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import EventCard from '@/components/EventCard';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for events
const mockEvents = [
  { id: '1', title: 'Hackathon 2025', image: 'https://picsum.photos/seed/event1/200/300' },
  { id: '2', title: 'Tech Fest', image: 'https://picsum.photos/seed/event2/200/300' },
  { id: '3', title: 'Cultural Night', image: 'https://picsum.photos/seed/event3/200/300' },
  { id: '4', title: 'Workshop', image: 'https://picsum.photos/seed/event4/200/300' }
];

const mockHackathons = [
  { id: '1', title: 'Smart India Hackathon', image: 'https://picsum.photos/seed/hack1/200/300' },
  { id: '2', title: 'Code Fest', image: 'https://picsum.photos/seed/hack2/200/300' },
  { id: '3', title: 'AI Challenge', image: 'https://picsum.photos/seed/hack3/200/300' }
];

const ExploreScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <FlatList
            data={mockEvents}
            renderItem={({ item }) => (
              <EventCard 
                title={item.title} 
                image={item.image}
                onPress={() => console.log(`Event pressed: ${item.title}`)} 
              />
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Hackathons</Text>
          <FlatList
            data={mockHackathons}
            renderItem={({ item }) => (
              <EventCard 
                title={item.title} 
                image={item.image}
                onPress={() => console.log(`Hackathon pressed: ${item.title}`)} 
              />
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  scrollView: {
    flex: 1
  },
  section: {
    marginTop: SIZES.xl,
    paddingHorizontal: SIZES.md
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 30,
    color: COLORS.black,
    marginBottom: SIZES.md,
    textAlign: 'center'
  },
  eventsList: {
    paddingVertical: SIZES.sm,
    gap: SIZES.sm
  }
});

export default ExploreScreen;
