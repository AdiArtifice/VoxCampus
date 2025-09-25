import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, useWindowDimensions } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { client, account, databases, ID, Query } from '@/lib/appwrite';
import { Functions } from 'react-native-appwrite';

// No mock data; start empty until backend is wired

type RequestItemProps = {
  name: string;
  department: string;
  onAccept?: () => void;
  onReject?: () => void;
  type: 'received' | 'sent';
};

const RequestItem: React.FC<RequestItemProps> = ({ name, department, onAccept, onReject, type }) => {
  return (
    <View style={styles.requestItem}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{name}</Text>
        <Text style={styles.requestDepartment}>{department}</Text>
      </View>

      {type === 'received' ? (
        <View style={styles.requestActions}>
          <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={onAccept}>
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={onReject}>
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onReject}>
          <Text style={styles.actionButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ConnectScreen = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const navigation = useNavigation();
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);
  const { width } = useWindowDimensions();

  const functions = useMemo(() => new Functions(client), []);
  const fnIdEnv = useMemo(
    () => (process.env.EXPO_PUBLIC_APPWRITE_FUNCTION_ID as string) || (process.env.EXPO_PUBLIC_APPWRITE_RECOMMENDATIONS_FUNCTION_ID as string) || '',
    []
  );

  // IDs
  const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID as string) || '68c58e83000a2666b4d9';
  const connectionsCol = 'connections';

  // Load requests for current user
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await account.get();
        // Received: toUserId == me.$id and status == 'pending'
        const recv = await databases.listDocuments(databaseId, connectionsCol, [
          Query.equal('toUserId', me.$id),
          Query.equal('status', 'pending')
        ]);
        // Sent: fromUserId == me.$id and status == 'pending'
        const sent = await databases.listDocuments(databaseId, connectionsCol, [
          Query.equal('fromUserId', me.$id),
          Query.equal('status', 'pending')
        ]);
        if (!mounted) return;
        setReceivedRequests(recv.documents || []);
        setSentRequests(sent.documents || []);
      } catch (e) {
        // no-op for now
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const fnId = fnIdEnv as string | undefined;
    if (!fnId) return; // Gracefully skip when not configured
    let mounted = true;
    (async () => {
      setRecLoading(true); setRecError(null);
      try {
        // Include current user info to exclude from recommendations
        let excludePayload: any = undefined;
        try {
          const me = await account.get();
          excludePayload = JSON.stringify({ excludeUserId: me.$id, excludeEmail: me.email });
        } catch {}

        const exec = await functions.createExecution(fnId, excludePayload, false);
        const code = (exec as any).responseStatusCode ?? 200;
        const body = (exec as any).responseBody ?? '[]';
        if (code >= 400) {
          try {
            const err = JSON.parse(body);
            throw new Error(err?.error || `Function error (${code})`);
          } catch {
            throw new Error(`Function error (${code})`);
          }
        }
        const me = await account.get().catch(() => null);
        const data = JSON.parse(body);
        let list = Array.isArray(data) ? data : [];
        // Defensive client-side filter: exclude self and obviously unverified entries
        if (me) {
          const myId = String(me.$id);
          const myEmail = String(me.email || '').toLowerCase();
          list = list.filter((u: any) => {
            const uid = String(u.$id || u.id || '');
            const email = String(u.email || '').toLowerCase();
            if (!email) return false;
            if (uid === myId) return false;
            if (email === myEmail) return false;
            // If backend included verification flags, respect them; otherwise allow
            if (typeof (u as any).emailVerification !== 'undefined' && (u as any).emailVerification !== true) return false;
            if (typeof (u as any).status !== 'undefined' && !((u as any).status === true || (u as any).status === 1 || (u as any).status === 'active')) return false;
            return true;
          });
        }
        if (mounted) setRecommended(list);
      } catch (e: any) {
        if (mounted) setRecError(e?.message ?? 'Failed to load recommendations');
      } finally {
        if (mounted) setRecLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [functions, fnIdEnv]);

  // Responsive columns for recommended grid
  const horizontalPadding = SIZES.md * 2;
  const cardMinWidth = 240;
  const numColumns = Math.max(1, Math.floor((width - horizontalPadding) / cardMinWidth));

  const renderRecommended = () => {
    if (!fnIdEnv) return null;
    return (
      <View style={styles.recommendedWrap}>
        <Text style={styles.recommendedTitle}>Recommended Users</Text>
        {recLoading ? (
          <View style={styles.recommendedState}><ActivityIndicator color={COLORS.primary} /><Text style={styles.recommendedStateText}> Loading…</Text></View>
        ) : recError ? (
          <Text style={styles.recommendedStateText}>Unable to load: {recError}</Text>
        ) : recommended.length === 0 ? (
          <Text style={styles.recommendedStateText}>No recommendations yet.</Text>
        ) : (
          <FlatList
            data={recommended}
            keyExtractor={(u: any) => u.$id}
            scrollEnabled={false}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? { columnGap: SIZES.sm } : undefined}
            contentContainerStyle={{ paddingHorizontal: SIZES.md, rowGap: SIZES.sm }}
            renderItem={({ item }) => {
              const displayName = item.name || (item.email ? String(item.email).split('@')[0] : 'Unknown');
              return (
                <View style={[styles.recommendedCard, { flex: 1 }]}> 
                  <Text style={styles.recommendedName}>{displayName}</Text>
                  {!!item.email && <Text style={styles.recommendedEmail}>{item.email}</Text>}
                  <View style={{ height: 8 }} />
                  <TouchableOpacity
                    style={styles.smallPrimaryBtn}
                    onPress={async () => {
                      try {
                        const me = await account.get();
                        await databases.createDocument(databaseId, connectionsCol, ID.unique(), {
                          fromUserId: me.$id,
                          fromName: me.name,
                          fromEmail: me.email,
                          toUserId: item.$id,
                          toName: item.name,
                          toEmail: item.email,
                          status: 'pending',
                          requestedAt: new Date().toISOString(),
                        });
                        // Optimistically update sent list
                        setSentRequests((prev) => [
                          {
                            $id: 'temp-' + item.$id,
                            fromUserId: me.$id,
                            toUserId: item.$id,
                            status: 'pending',
                            toName: item.name,
                            toEmail: item.email,
                            requestedAt: new Date().toISOString(),
                          },
                          ...prev,
                        ]);
                      } catch (e) {
                        console.log('Failed to send request', e);
                      }
                    }}
                  >
                    <Text style={styles.smallPrimaryBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Removed Pending Requests header; streamlined layout */}

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'received' && styles.activeTabButton]} 
          onPress={() => setActiveTab('received')}
        >
          <Text style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'sent' && styles.activeTabButton]} 
          onPress={() => setActiveTab('sent')}
        >
          <Text style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>Sent</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'received' ? receivedRequests : sentRequests}
        renderItem={({ item }) => (
          <RequestItem
            name={activeTab === 'received' ? (item.fromName || item.fromEmail || item.fromUserId) : (item.toName || item.toEmail || item.toUserId)}
            department={activeTab === 'received' ? (item.fromEmail || '') : (item.toEmail || '')}
            type={activeTab}
            onAccept={async () => {
              if (activeTab !== 'received') return;
              try {
                await databases.updateDocument(databaseId, connectionsCol, item.$id, {
                  status: 'accepted',
                  respondedAt: new Date().toISOString(),
                });
                setReceivedRequests((prev) => prev.filter((r) => r.$id !== item.$id));
              } catch (e) {
                console.log('Accept failed', e);
              }
            }}
            onReject={async () => {
              try {
                // If received, reject updates status; if sent, cancel = delete
                if (activeTab === 'received') {
                  await databases.updateDocument(databaseId, connectionsCol, item.$id, {
                    status: 'rejected',
                    respondedAt: new Date().toISOString(),
                  });
                  setReceivedRequests((prev) => prev.filter((r) => r.$id !== item.$id));
                } else {
                  await databases.deleteDocument(databaseId, connectionsCol, item.$id);
                  setSentRequests((prev) => prev.filter((r) => r.$id !== item.$id));
                }
              } catch (e) {
                console.log('Reject/Cancel failed', e);
              }
            }}
          />
        )}
        keyExtractor={item => item.$id}
        contentContainerStyle={styles.requestsList}
        ListFooterComponent={renderRecommended}
        ListFooterComponentStyle={{ paddingBottom: SIZES.lg }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  recommendedWrap: {
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  recommendedTitle: {
    fontFamily: FONTS.body,
    fontSize: 22,
    color: COLORS.black,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.sm,
  },
  recommendedState: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
  },
  recommendedStateText: {
    fontFamily: FONTS.regular,
    color: COLORS.black,
    opacity: 0.7,
    paddingHorizontal: SIZES.md,
  },
  recommendedCard: {
    width: 240,
    padding: SIZES.md,
    marginRight: SIZES.sm,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  recommendedName: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  recommendedEmail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.black,
    opacity: 0.7,
  },
  smallPrimaryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius.sm,
  },
  smallPrimaryBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SIZES.sm
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary
  },
  tabText: {
    fontFamily: FONTS.body,
    fontSize: 25,
    color: COLORS.black
  },
  activeTabText: {
    color: COLORS.primary
  },
  requestsList: {
    padding: SIZES.md
  },
  requestItem: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.borderRadius.sm,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  requestInfo: {
    flex: 1
  },
  requestName: {
    fontFamily: FONTS.body,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 4
  },
  requestDepartment: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.black,
    opacity: 0.7
  },
  requestActions: {
    flexDirection: 'row',
    gap: SIZES.sm
  },
  actionButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
    borderRadius: SIZES.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  acceptButton: {
    backgroundColor: COLORS.primary
  },
  rejectButton: {
    backgroundColor: COLORS.error
  },
  cancelButton: {
    backgroundColor: COLORS.error
  },
  actionButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 14
  }
});

export default ConnectScreen;
