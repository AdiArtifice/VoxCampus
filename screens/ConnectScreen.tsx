import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import IconArrowRight from '@/assets/images/IconArrowRight';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Mock data for connection requests
const mockReceivedRequests = [
  { id: '1', name: 'Jane Smith', department: 'Computer Science' },
  { id: '2', name: 'Michael Brown', department: 'Electronics' },
  { id: '3', name: 'Emily Davis', department: 'Mechanical' }
];

const mockSentRequests = [
  { id: '1', name: 'Alex Johnson', department: 'Information Technology' },
  { id: '2', name: 'Sarah Williams', department: 'Civil Engineering' }
];

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
        data={activeTab === 'received' ? mockReceivedRequests : mockSentRequests}
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
