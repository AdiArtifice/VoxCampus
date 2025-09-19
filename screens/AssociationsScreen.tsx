import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import ClubCard from '@/components/ClubCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { client, databases, Query, account } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';

// Removed mock followed lists; using live data + user prefs instead

type AssociationDoc = {
  $id: string;
  name: string;
  images?: string | null;
  isActive?: boolean;
  type?: string;
  [key: string]: any;
};

const AssociationsScreen = () => {
  const { user } = useAuth();
  const [associations, setAssociations] = useState<AssociationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // My Association modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAssocId, setSelectedAssocId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  // Followed Associations state
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [draftFollowIds, setDraftFollowIds] = useState<Set<string>>(new Set());
  const [followSaving, setFollowSaving] = useState(false);
  const [followMsg, setFollowMsg] = useState<string | null>(null);

  const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
  const associationCollectionId = (process.env.EXPO_PUBLIC_APPWRITE_ASSOCIATION_COLLECTION_ID as string) || 'association';
  const membershipCollectionId = (process.env.EXPO_PUBLIC_APPWRITE_MEMBERSHIP_COLLECTION_ID as string) || 'membership';

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
        type: d.type,
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

  // Load followed associations from user prefs
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const prefs = await account.getPrefs<Record<string, unknown>>();
        const ids = Array.isArray((prefs as any).followedAssociations)
          ? ((prefs as any).followedAssociations as string[])
          : [];
        setFollowedIds(ids);
      } catch {
        // non-fatal
      }
    })();
  }, [user]);

  const toggleDraftFollow = useCallback((id: string) => {
    setDraftFollowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const openFollowModal = useCallback(() => {
    setFollowMsg(null);
    setDraftFollowIds(new Set(followedIds));
    setFollowModalVisible(true);
  }, [followedIds]);

  const saveFollowed = useCallback(async () => {
    if (!user) { setFollowMsg('Please log in to follow associations.'); return; }
    setFollowSaving(true); setFollowMsg(null);
    try {
      const ids = Array.from(draftFollowIds);
      await account.updatePrefs({ followedAssociations: ids });
      setFollowedIds(ids);
      setFollowModalVisible(false);
    } catch (e: any) {
      setFollowMsg(e?.message ?? 'Failed to save followed associations');
    } finally {
      setFollowSaving(false);
    }
  }, [user, draftFollowIds]);

  const unfollow = useCallback(async (id: string) => {
    const next = followedIds.filter(x => x !== id);
    setFollowedIds(next);
    try {
      if (user) await account.updatePrefs({ followedAssociations: next });
    } catch {
      // ignore silently
    }
  }, [followedIds, user]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* My Associations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Associations</Text>
          <View style={styles.clubsRow}>
            <ClubCard
              name={joined ? 'My Association (Joined)' : 'My Association'}
              onPress={() => {
                setVerifyMsg(null);
                setSelectedAssocId(null);
                setModalVisible(true);
              }}
            />
          </View>
        </View>

        {/* Followed Associations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Followed Associations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {followedIds.length === 0 ? (
              <ClubCard name="Choose to follow" onPress={openFollowModal} />
            ) : (
              <>
                {followedIds.map((id) => {
                  const a = associations.find(x => x.$id === id);
                  const img = resolveImage(a?.images) || placeholder;
                  return (
                    <TouchableOpacity key={id} onLongPress={() => unfollow(id)} activeOpacity={0.8}>
                      <ClubCard name={a?.name ?? 'Unknown'} logo={img} onPress={() => { /* TODO: navigate to association */ }} />
                    </TouchableOpacity>
                  );
                })}
                <ClubCard name="Edit" onPress={openFollowModal} />
              </>
            )}
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

      {/* My Association Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select your association</Text>
            {!user && (
              <Text style={[styles.stateText, { marginBottom: SIZES.sm }]}>Please log in to verify membership.</Text>
            )}
            <ScrollView style={{ maxHeight: 320 }}>
              {associations.map((a) => (
                <TouchableOpacity
                  key={a.$id}
                  style={[styles.optionRow, selectedAssocId === a.$id && styles.optionRowSelected]}
                  onPress={() => setSelectedAssocId(a.$id)}
                >
                  <Text style={styles.optionText}>{a.name} {a.type ? `(${a.type})` : ''}</Text>
                </TouchableOpacity>
              ))}
              {associations.length === 0 && (
                <Text style={styles.stateText}>No associations available.</Text>
              )}
            </ScrollView>
            {verifyMsg && <Text style={[styles.stateText, { marginTop: SIZES.sm }]}>{verifyMsg}</Text>}
            <View style={styles.modalButtons}>
              <Button text="Cancel" onPress={() => { setModalVisible(false); setVerifyMsg(null); }} />
              <View style={{ width: SIZES.sm }} />
              <Button
                text={verifying ? 'Verifying…' : 'Submit'}
                onPress={async () => {
                  if (!user) { setVerifyMsg('Please log in first.'); return; }
                  if (!selectedAssocId) { setVerifyMsg('Please select an association.'); return; }
                  setVerifying(true);
                  setVerifyMsg(null);
                  try {
                    const email = user.email as string;
                    const res = await databases.listDocuments(databaseId, membershipCollectionId, [
                      Query.equal('userId', email),
                      Query.equal('orgId', selectedAssocId),
                      Query.limit(1)
                    ]);
                    if ((res.total ?? 0) > 0) {
                      setJoined(true);
                      setVerifyMsg('Joined');
                    } else {
                      const assoc = associations.find(x => x.$id === selectedAssocId);
                      const t = assoc?.type ?? 'association';
                      setJoined(false);
                      setVerifyMsg(`You're not the member of '${t}'.`);
                    }
                  } catch (e: any) {
                    setVerifyMsg(e?.message ?? 'Unable to verify membership.');
                  } finally {
                    setVerifying(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Followed Associations Modal */}
      <Modal
        visible={followModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFollowModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Follow associations</Text>
            {!user && (
              <Text style={[styles.stateText, { marginBottom: SIZES.sm }]}>Please log in to save your followed list.</Text>
            )}
            <ScrollView style={{ maxHeight: 320 }}>
              {associations.map((a) => {
                const selected = draftFollowIds.has(a.$id);
                return (
                  <TouchableOpacity
                    key={a.$id}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => toggleDraftFollow(a.$id)}
                  >
                    <Text style={styles.optionText}>{selected ? '✓ ' : ''}{a.name} {a.type ? `(${a.type})` : ''}</Text>
                  </TouchableOpacity>
                );
              })}
              {associations.length === 0 && (
                <Text style={styles.stateText}>No associations available.</Text>
              )}
            </ScrollView>
            {followMsg && <Text style={[styles.stateText, { marginTop: SIZES.sm }]}>{followMsg}</Text>}
            <View style={styles.modalButtons}>
              <Button text="Cancel" onPress={() => setFollowModalVisible(false)} />
              <View style={{ width: SIZES.sm }} />
              <Button text={followSaving ? 'Saving…' : 'Save'} onPress={saveFollowed} />
            </View>
          </View>
        </View>
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.md
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.md
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.black,
    marginBottom: SIZES.sm
  },
  optionRow: {
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.lightGray
  },
  optionRowSelected: {
    backgroundColor: '#F7F8FA'
  },
  optionText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.black
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SIZES.md
  }
});

export default AssociationsScreen;
