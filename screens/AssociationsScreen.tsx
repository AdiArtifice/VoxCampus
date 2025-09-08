import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import ClubCard from '@/components/ClubCard';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for clubs and associations
const myAssociations = [
  { id: '1', name: 'A Club', logo: 'https://picsum.photos/seed/club1/100/100' },
  { id: '2', name: 'C Cells', logo: 'https://picsum.photos/seed/club2/100/100' }
];

const followedClubs = [
  { id: '1', name: 'A Club', logo: 'https://picsum.photos/seed/club3/100/100' },
  { id: '2', name: 'B Club', logo: 'https://picsum.photos/seed/club4/100/100' },
  { id: '3', name: 'C Club', logo: 'https://picsum.photos/seed/club5/100/100' },
  { id: '4', name: 'D Club', logo: 'https://picsum.photos/seed/club6/100/100' }
];

const followedCells = [
  { id: '1', name: 'A Cells', logo: 'https://picsum.photos/seed/cell1/100/100' },
  { id: '2', name: 'B Cells', logo: 'https://picsum.photos/seed/cell2/100/100' },
  { id: '3', name: 'C Cells', logo: 'https://picsum.photos/seed/cell3/100/100' },
  { id: '4', name: 'D Cells', logo: 'https://picsum.photos/seed/cell4/100/100' }
];

const sjcemAssociations = [
  { id: '1', name: 'Student Council', logo: 'https://picsum.photos/seed/assoc1/100/100' },
  { id: '2', name: 'NSS units', logo: 'https://picsum.photos/seed/assoc2/100/100' },
  { id: '3', name: 'NCC units', logo: 'https://picsum.photos/seed/assoc3/100/100' },
  { id: '4', name: 'XYZ Societies', logo: 'https://picsum.photos/seed/assoc4/100/100' }
];

const AssociationsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* My Associations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Associations</Text>
          <View style={styles.clubsRow}>
            {myAssociations.map(club => (
              <ClubCard
                key={club.id}
                name={club.name}
                logo={club.logo}
                onPress={() => console.log(`My association pressed: ${club.name}`)}
              />
            ))}
          </View>
        </View>

        {/* Followed Clubs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Followed Clubs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {followedClubs.map(club => (
              <ClubCard
                key={club.id}
                name={club.name}
                logo={club.logo}
                onPress={() => console.log(`Followed club pressed: ${club.name}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Followed Cells Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Followed Cells</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {followedCells.map(cell => (
              <ClubCard
                key={cell.id}
                name={cell.name}
                logo={cell.logo}
                onPress={() => console.log(`Followed cell pressed: ${cell.name}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* SJCEM Associations Section */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Associations at SJCEM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {sjcemAssociations.map(assoc => (
              <ClubCard
                key={assoc.id}
                name={assoc.name}
                logo={assoc.logo}
                onPress={() => console.log(`SJCEM association pressed: ${assoc.name}`)}
              />
            ))}
          </ScrollView>
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
    flex: 1,
    paddingTop: SIZES.md
  },
  section: {
    marginBottom: SIZES.xl
  },
  lastSection: {
    marginBottom: SIZES.xxl * 2 // Extra space at the bottom
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 30,
    color: COLORS.black,
    marginBottom: SIZES.md,
    paddingHorizontal: SIZES.md
  },
  clubsRow: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    flexWrap: 'wrap',
    gap: SIZES.md
  },
  horizontalScroll: {
    paddingHorizontal: SIZES.md
  }
});

export default AssociationsScreen;
