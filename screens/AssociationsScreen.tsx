import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TouchableOpacity, Image, Pressable, Linking } from 'react-native';
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
  const [myAssociationId, setMyAssociationId] = useState<string | null>(null);

  // Followed Associations state
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followModalVisible, setFollowModalVisible] = useState(false);
  const [draftFollowIds, setDraftFollowIds] = useState<Set<string>>(new Set());
  const [followSaving, setFollowSaving] = useState(false);
  const [followMsg, setFollowMsg] = useState<string | null>(null);

  // Association details modal
  const [selectedAssoc, setSelectedAssoc] = useState<AssociationDoc | null>(null);

  // Fallback overrides based on provided clubs JSON (used only if backend fields are missing)
  const clubOverrides = useMemo(() => ({
    'association-ascai': {
      description: 'Association of Students in Computer and Artificial Intelligence.',
      founded_year: '2022',
      faculty_coordinator_name: 'Prof.Sandeep Dwivedi',
      faculty_coordinator_email: 'anjali.sharma@college.edu',
      committee_core_team: [
        { profile_id: 'u101', name: 'Hiten Champanerkar', year: '4th Year', role: 'President', profile_pic: 'https://example.com/users/rohan.jpg' },
        { profile_id: 'u102', name: 'Priti Singh', year: '3rd Year', role: 'Vice President', profile_pic: 'https://example.com/users/nidhi.jpg' },
      ],
      instagram: 'https://www.instagram.com/ascai_sjcem?igsh=MThzcjQ5OXJrMDM1OQ==',
      linkedin: 'https://www.linkedin.com/company/ascai-sjcem/',
      website: 'https://ascai-ai.vercel.app/',
    },
    'association-itsa': {
      description: 'A community for students passionate about Information Technology and related fields.',
      founded_year: '2015',
      committee_core_team: [
        { profile_id: 'u201', name: 'Priya Singh', year: '3rd Year', role: 'President', profile_pic: 'https://example.com/users/priya.jpg' },
      ],
      instagram: 'https://www.instagram.com/itsa_sjcem?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
      linkedin: 'https://linkedin.com/company/itsa',
      website: 'https://itsa.college.edu',
    },
  } as Record<string, any>), []);

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

  // No separate clubs load: we show details from Association docs directly

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
        const myAssocId = (prefs as any).myAssociationId as string | undefined;
        setJoined(!!myAssocId);
        setMyAssociationId(myAssocId ?? null);
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
            {(() => {
              const myAssoc = associations.find(a => a.$id === myAssociationId);
              const logo = myAssoc ? (resolveImage(myAssoc.images) || placeholder) : undefined;
              return (
                <ClubCard
                  name={myAssoc ? myAssoc.name : ''}
                  showName={!!myAssoc}
                  smallName={false}
                  logo={logo}
                  onPress={() => {
                    setVerifyMsg(null);
                    setSelectedAssocId(null);
                    setModalVisible(true);
                  }}
                />
              );
            })()}
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
              {associations.filter(a => (a.name || '').trim().toLowerCase() !== 'sjcem').length === 0 ? (
                <View style={styles.stateWrap}><Text style={styles.stateText}>No associations found.</Text></View>
              ) : (
                associations
                  .filter(a => (a.name || '').trim().toLowerCase() !== 'sjcem')
                  .map((assoc) => {
                    const img = resolveImage(assoc.images) || placeholder;
                    return (
                      <ClubCard
                        key={assoc.$id}
                        name={assoc.name}
                        logo={img}
                        onPress={() => {
                          const allowed = new Set(['association-ascai', 'association-itsa', 'association-spca', 'association-mesa']);
                          if (allowed.has(assoc.$id)) {
                            setSelectedAssoc(assoc);
                          }
                        }}
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
                    const email = (user.email as string) ?? '';
                    const candidates = Array.from(new Set([
                      email,
                      email.toLowerCase?.() ?? email,
                      (user.$id as string) ?? ''
                    ].filter(Boolean)));
                    const res = await databases.listDocuments(databaseId, membershipCollectionId, [
                      Query.equal('userId', candidates),
                      Query.equal('orgId', selectedAssocId),
                      Query.limit(1)
                    ]);
                    if ((res.total ?? 0) > 0) {
                      setJoined(true);
                      setVerifyMsg('Joined');
                      try {
                        await account.updatePrefs({ myAssociationId: selectedAssocId });
                        setMyAssociationId(selectedAssocId);
                      } catch {}
                    } else {
                      const assoc = associations.find(x => x.$id === selectedAssocId);
                      const t = assoc?.name ?? assoc?.type ?? 'association';
                      setJoined(false);
                      setVerifyMsg(`You're not a member of '${t}'.`);
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

      {/* Association details modal */}
      <Modal
        visible={!!selectedAssoc}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedAssoc(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedAssoc(null)}>
          <Pressable style={[styles.modalCard, { maxWidth: 560 }]} onPress={(e) => e.stopPropagation()}>
            {!!selectedAssoc && (() => {
              const override = clubOverrides[selectedAssoc.$id] || {};
              const merged: any = { ...selectedAssoc, ...override };
              const img = resolveImage(merged.images);
              const title = merged.name || '';
              const description = merged.description;
              const founded = merged.founded_year ?? merged.foundedYear;
              const facultyName = merged.faculty_coordinator_name ?? merged.facultyCoordinatorName;
              const facultyEmail = merged.faculty_coordinator_email ?? merged.facultyCoordinatorEmail;
              let core: any[] = [];
              try {
                if (Array.isArray(merged.committee_core_team)) core = merged.committee_core_team;
                else if (typeof merged.committee_core_team === 'string') {
                  const parsed = JSON.parse(merged.committee_core_team);
                  if (Array.isArray(parsed)) core = parsed;
                }
              } catch {}
              const findFromDesc = (pattern: RegExp): string | null => {
                if (!description) return null;
                const m = description.match(pattern);
                return m ? m[0] : null;
              };
              const ig = merged.instagram ?? findFromDesc(/https?:\/\/\S*instagram\.com\S*/i);
              const li = merged.linkedin ?? findFromDesc(/https?:\/\/\S*linkedin\.com\S*/i);
              const web = merged.website ?? findFromDesc(/https?:\/\/(?!\S*(instagram|linkedin)\.com)\S+/i);
              return (
                <View>
                  <View style={{ alignItems: 'center', marginBottom: SIZES.sm }}>
                    {img ? <Image source={{ uri: img }} style={[styles.clubLogo, { width: 96, height: 96 }]} /> : null}
                    <Text style={styles.modalTitle}>{title}</Text>
                  </View>
                  {!!description && (
                    <Text style={[styles.stateText, { color: COLORS.black, marginBottom: SIZES.sm, textAlign: 'center' }]}>{description}</Text>
                  )}
                  {!!founded && (
                    <Text style={[styles.stateText, { color: COLORS.black }]}> <Text style={{ fontFamily: FONTS.heading }}>Founded:</Text> {founded}</Text>
                  )}
                  {(facultyName || facultyEmail) && (
                    <Text style={[styles.stateText, { color: COLORS.black, marginTop: SIZES.xs }]}>
                      <Text style={{ fontFamily: FONTS.heading }}>Faculty Coordinator:</Text> {facultyName ?? '—'}{facultyEmail ? ' ' : ''}
                      {facultyEmail ? (
                        <Text style={{ color: '#2762e2' }} onPress={() => Linking.openURL(`mailto:${facultyEmail}`)}>({facultyEmail})</Text>
                      ) : null}
                    </Text>
                  )}
                  {core.length > 0 && (
                    <View style={{ marginTop: SIZES.sm }}>
                      <Text style={[styles.sectionTitle, { fontSize: 20, paddingHorizontal: 0, marginBottom: SIZES.xs, textAlign: 'left' }]}>Core Team</Text>
                      {core.map((m: any) => (
                        <View key={m.profile_id ?? m.name} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
                          {m.profile_pic ? (
                            <Image source={{ uri: m.profile_pic }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
                          ) : (
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE', marginRight: 10 }} />
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONTS.heading, color: COLORS.black }}>{m.name} {m.role ? `• ${m.role}` : ''}</Text>
                            {!!m.year && <Text style={styles.stateText}>{m.year}</Text>}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={[styles.clubLinks, { marginTop: SIZES.md }]}>
                    {ig ? <Text style={styles.linkPill} onPress={() => Linking.openURL(ig)}>Instagram</Text> : null}
                    {li ? <Text style={[styles.linkPill, styles.linkPillLinkedIn]} onPress={() => Linking.openURL(li)}>LinkedIn</Text> : null}
                    {web ? <Text style={[styles.linkPill, styles.linkPillWebsite]} onPress={() => Linking.openURL(web)}>Website</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', marginTop: SIZES.md }}>
                    <Button text="Close" onPress={() => setSelectedAssoc(null)} />
                  </View>
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
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
  },
  // CSS-inspired styles for clubs grid and card
  clubsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: SIZES.md,
  },
  clubCard: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  clubLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    resizeMode: 'contain',
  },
  clubTitle: {
    fontSize: 20,
    color: '#2762e2',
    marginBottom: 10,
    fontFamily: FONTS.heading,
    textAlign: 'center',
  },
  clubDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
  clubLinks: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#E1306C',
    color: 'white',
    borderRadius: 6,
    fontSize: 13,
    overflow: 'hidden',
  },
  linkPillLinkedIn: {
    backgroundColor: '#0077b5',
  },
  linkPillWebsite: {
    backgroundColor: '#2762e2',
  }
});

export default AssociationsScreen;
