import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { databases } from '../lib/appwrite';
import { ID } from 'appwrite';

interface CreateGroupData {
  name: string;
  description: string;
}

export default function CreateGroupScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateGroupData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateGroupData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length > 128) {
      newErrors.name = 'Group name must be less than 128 characters';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create groups.');
      return;
    }

    setLoading(true);

    try {
      // Prepare the document data
      const documentData = {
        name: formData.name.trim(),
        ...(formData.description && { description: formData.description.trim() }),
        creatorId: user.$id,
      };

      // Create the document in Appwrite
      await databases.createDocument(
        '68c58e83000a2666b4d9', // database ID
        'private_groups', // collection ID
        ID.unique(),
        documentData
      );

      Alert.alert(
        'Success!',
        'Your private group has been created successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      let errorMessage = 'Failed to create group. Please try again.';
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to create groups. Please contact an administrator.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof CreateGroupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Private Group</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? 'Creating...' : 'Create'}</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Group Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                placeholder="Enter group name"
                maxLength={128}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              <Text style={styles.helperText}>Choose a descriptive name for your private group</Text>
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Describe the purpose of this group (optional)"
                multiline
                numberOfLines={4}
                maxLength={1000}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              <Text style={styles.helperText}>
                What is this group about? What kind of discussions or activities will take place?
              </Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>About Private Groups</Text>
              <Text style={styles.infoText}>
                • Private groups are spaces for focused discussions and collaboration
              </Text>
              <Text style={styles.infoText}>
                • Only you and invited members will have access to the group
              </Text>
              <Text style={styles.infoText}>
                • You can manage group settings and membership after creation
              </Text>
              <Text style={styles.infoText}>
                • Groups can be used for projects, study sessions, event planning, and more
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  cancelButton: {
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});