import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Modal, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import EventCard from '@/components/EventCard';
import { SafeAreaView } from 'react-native-safe-area-context';

// Events & Sessions posters from the same public bucket (remaining files)
const eventFiles = [
  { id: '68ceec7e0018ef9b8f2e', title: 'Event Poster A' }, // WhatsApp Image 2025-08-14 at 14.36.01_afca95af.jpg
  { id: '68ceec860038df0bd9fd', title: 'Event Poster B' }, // WhatsApp Image 2025-08-21 at 12.40.42_a599248b.jpg
  { id: '68ceec8d0031f52a2105', title: 'Event Poster C' }, // WhatsApp Image 2025-08-23 at 16.16.37_e22e14f1.jpg
  { id: '68ceecab0038703c7c0d', title: 'Event Poster D' }, // WhatsApp Image 2025-09-17 at 08.52.23_17fa294d.jpg
];

const HACKATHON_BUCKET_ID = (process.env.EXPO_PUBLIC_TEMP_EVENTS_BUCKET_ID as string) || '68ceec4f003d43dc50bb';
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT as string;
const APPWRITE_PROJECT = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string;

function storageViewUrl(fileId: string) {
  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT) return undefined;
  return `${APPWRITE_ENDPOINT}/storage/buckets/${HACKATHON_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT}`;
}

// Provided files in bucket temp_events_images (public read)
const hackathonFiles = [
  { id: '68ceec95003df937e241', title: 'Hackathon Poster 1' }, // WhatsApp Image 2025-09-02 at 20.43.01_adf5ec77.jpg
  { id: '68ceec9d00307d9cfc00', title: 'Hackathon Poster 2' }, // WhatsApp Image 2025-09-08 at 23.33.21_7a3615b4.jpg
  { id: '68ceeca40002f83257a9', title: 'Hackathon Poster 3' }  // WhatsApp Image 2025-09-13 at 12.08.23_c9afd67b.jpg
];

const mockHackathons = hackathonFiles.map((f) => ({ id: f.id, title: f.title, image: storageViewUrl(f.id) }));

const ExploreScreen = () => {
  const [preview, setPreview] = useState<{ title: string; image?: string } | null>(null);
  const mockEvents = useMemo(() => eventFiles.map((f) => ({ id: f.id, title: f.title, image: storageViewUrl(f.id) })), []);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events and Sessions</Text>
          <FlatList
            data={mockEvents}
            renderItem={({ item }) => (
              <EventCard 
                title={item.title} 
                image={item.image}
                onPress={() => setPreview({ title: item.title, image: item.image })} 
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
                onPress={() => setPreview({ title: item.title, image: item.image })} 
              />
            )}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
          />
        </View>
      </ScrollView>

      {/* Fullscreen Poster Modal (image only) */}
      <Modal
        visible={!!preview}
        animationType="fade"
        transparent
        onRequestClose={() => setPreview(null)}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPreview(null)}>
          {preview?.image ? (
            <Image source={{ uri: preview.image }} style={styles.fullscreenImage} resizeMode="contain" />
          ) : null}
        </TouchableOpacity>
      </Modal>
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fullscreenImage: {
    width: '100%',
    height: '100%'
  }
});

export default ExploreScreen;
