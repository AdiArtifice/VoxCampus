import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import ClubCard from '@/components/ClubCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { client, databases, Query } from '@/lib/appwrite';

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

type AssociationDoc = {
  $id: string;
  name: string;
  images?: string | null;
  isActive?: boolean;
  [key: string]: any;
};

const AssociationsScreen = () => {
  const [associations, setAssociations] = useState<AssociationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
  const associationCollectionId = (process.env.EXPO_PUBLIC_APPWRITE_ASSOCIATION_COLLECTION_ID as string) || 'association';

  const placeholder = useMemo(() => 'https://via.placeholder.com/200x200.png?text=Association', []);

  const resolveImage = (img?: string | null): string | undefined => {
    if (!img) return undefined;
    // If already a full URL, return as-is
    if (/^https?:\/\//i.test(img)) return img;
    // Otherwise assume it's a file ID in Appwrite storage and attempt to create a preview URL
    try {
      // Using the public storage preview endpoint via client config
      const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT as string;
      const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as string;
      const bucketId = (process.env.EXPO_PUBLIC_APPWRITE_PUBLIC_BUCKET_ID as string) || '68cd3daf000b092d007b';
      return `${endpoint}/storage/buckets/${bucketId}/files/${img}/view?project=${project}`;
    } catch {
      return undefined;
    }
  };

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await databases.listDocuments(databaseId, associationCollectionId, [
        Query.equal('isActive', true),
        Query.orderAsc('name'),
        Query.limit(100)
      ]);
      const mapped = (res.documents || []).map((d: any) => ({
        $id: d.$id,
        name: d.name,
        images: d.images,
        isActive: d.isActive,
      })) as AssociationDoc[];
      setAssociations(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load associations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
    // Realtime subscription
    const unsubscribe = client.subscribe(
      `databases.${databaseId}.collections.${associationCollectionId}.documents`,
      () => {
        // Refresh on any create/update/delete
        fetchAssociations();
      }
    );
    return () => {
      try { unsubscribe(); } catch {}
    };
  }, []);

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
          {loading && (
            <View style={styles.stateWrap}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.stateText}>Loading associations…</Text>
            </View>
          )}
          {!!error && !loading && (
            <View style={styles.stateWrap}>
              <Text style={styles.stateText}>Unable to load associations: {error}</Text>
            </View>
          )}
          {!loading && !error && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {associations.length === 0 ? (
                <View style={styles.stateWrap}><Text style={styles.stateText}>No associations found.</Text></View>
              ) : (
                associations.map((assoc) => {
                  const img = resolveImage(assoc.images) || placeholder;
                  return (
                    <ClubCard
                      key={assoc.$id}
                      name={assoc.name}
                      logo={img}
                      onPress={() => console.log(`SJCEM association pressed: ${assoc.name}`)}
                    />
                  );
                })
              )}
            </ScrollView>
          )}
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
  ,
  stateWrap: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm
  },
  stateText: {
    color: COLORS.gray,
    fontFamily: FONTS.body,
    fontSize: 16
  }
});

export default AssociationsScreen;
