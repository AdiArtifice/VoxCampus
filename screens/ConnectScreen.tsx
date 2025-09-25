import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import IconArrowRight from '@/assets/images/IconArrowRight';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { client } from '@/lib/appwrite';
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
  const [receivedRequests] = useState<any[]>([]);
  const [sentRequests] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);

  const functions = useMemo(() => new Functions(client), []);

  useEffect(() => {
    const fnId = process.env.EXPO_PUBLIC_APPWRITE_RECOMMENDATIONS_FUNCTION_ID as string | undefined;
    if (!fnId) return; // Gracefully skip when not configured
    let mounted = true;
    (async () => {
      setRecLoading(true); setRecError(null);
      try {
        const exec = await functions.createExecution(fnId, undefined, false);
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
        const data = JSON.parse(body);
        if (mounted) setRecommended(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (mounted) setRecError(e?.message ?? 'Failed to load recommendations');
      } finally {
        if (mounted) setRecLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [functions]);

  const goToPendingRequests = () => {
    // Navigate to the Pending Requests screen
    // This would use the actual navigation in a real app
    console.log('Navigate to Pending Requests');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerContent} onPress={goToPendingRequests}>
          <Text style={styles.headerTitle}>Pending Requests</Text>
          <IconArrowRight width={30} height={15} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Recommended Users */}
      {!!process.env.EXPO_PUBLIC_APPWRITE_RECOMMENDATIONS_FUNCTION_ID && (
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
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIZES.md }}
            renderItem={({ item }) => {
              const displayName = item.name || (item.email ? String(item.email).split('@')[0] : 'Unknown');
              return (
                <View style={styles.recommendedCard}>
                  <Text style={styles.recommendedName}>{displayName}</Text>
                  {!!item.email && <Text style={styles.recommendedEmail}>{item.email}</Text>}
                  <View style={{ height: 8 }} />
                  <TouchableOpacity style={styles.smallPrimaryBtn} onPress={() => console.log('Connect ->', item.$id)}>
                    <Text style={styles.smallPrimaryBtnText}>Connect</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
  </View>
  )}

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
            name={item.name}
            department={item.department}
            type={activeTab}
            onAccept={() => console.log(`Accept request from ${item.name}`)}
            onReject={() => console.log(`Reject request from ${item.name}`)}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.requestsList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  header: {
    height: 67,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    justifyContent: 'center'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    fontFamily: FONTS.body,
    fontSize: 25,
    color: COLORS.black,
    marginRight: SIZES.md
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
