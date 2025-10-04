import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { databases } from '../lib/appwrite';
import { ID } from 'appwrite';

interface CreatePostData {
  title: string;
  description: string;
  type: 'event' | 'session' | 'workshop' | 'webinar' | 'meetup' | 'talk';
  startAt: Date;
  endAt: Date | null;
  location: string;
  organizer: string;
  rsvpUrl: string;
  meetingUrl: string;
  infoUrl: string;
  bannerUrl: string;
  isFeatured: boolean;
}

const POST_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'session', label: 'Session' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'talk', label: 'Talk' },
] as const;

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { user, userMemberships, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    description: '',
    type: 'event',
    startAt: new Date(),
    endAt: null,
    location: '',
    organizer: '',
    rsvpUrl: '',
    meetingUrl: '',
    infoUrl: '',
    bannerUrl: '',
    isFeatured: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreatePostData, string>>>({});

  // Check if user has memberships
  const hasActiveMemberships = userMemberships && userMemberships.length > 0;

  useEffect(() => {
    if (!authLoading && (!user || !hasActiveMemberships)) {
      Alert.alert(
        'Access Denied',
        'You need to be a member of at least one association to create posts.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user, hasActiveMemberships, authLoading, navigation]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreatePostData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 4000) {
      newErrors.description = 'Description must be less than 4000 characters';
    }

    if (formData.startAt <= new Date()) {
      newErrors.startAt = 'Start date must be in the future';
    }

    if (formData.endAt && formData.endAt <= formData.startAt) {
      newErrors.endAt = 'End date must be after start date';
    }

    if (formData.location && formData.location.length > 300) {
      newErrors.location = 'Location must be less than 300 characters';
    }

    if (formData.organizer && formData.organizer.length > 200) {
      newErrors.organizer = 'Organizer name must be less than 200 characters';
    }

    // URL validations
    const urlFields: (keyof CreatePostData)[] = ['rsvpUrl', 'meetingUrl', 'infoUrl', 'bannerUrl'];
    urlFields.forEach(field => {
      if (formData[field] && !isValidUrl(formData[field] as string)) {
        newErrors[field] = 'Please enter a valid URL';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting.');
      return;
    }

    if (!user || !hasActiveMemberships) {
      Alert.alert('Error', 'You must be a member to create posts.');
      return;
    }

    setLoading(true);

    try {
      // Prepare the document data
      const documentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        startAt: formData.startAt.toISOString(),
        ...(formData.endAt && { endAt: formData.endAt.toISOString() }),
        ...(formData.location && { location: formData.location.trim() }),
        ...(formData.organizer && { organizer: formData.organizer.trim() }),
        ...(formData.rsvpUrl && { rsvpUrl: formData.rsvpUrl.trim() }),
        ...(formData.meetingUrl && { meetingUrl: formData.meetingUrl.trim() }),
        ...(formData.infoUrl && { infoUrl: formData.infoUrl.trim() }),
        ...(formData.bannerUrl && { bannerUrl: formData.bannerUrl.trim() }),
        isFeatured: formData.isFeatured,
        organizerId: user.$id,
      };

      // Create the document in Appwrite
      await databases.createDocument(
        '68c58e83000a2666b4d9', // database ID
        'events_and_sessions', // collection ID
        ID.unique(),
        documentData
      );

      Alert.alert(
        'Success!',
        'Your post has been created successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      let errorMessage = 'Failed to create post. Please try again.';
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to create posts. Please contact an administrator.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof CreatePostData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !hasActiveMemberships) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            You need to be a member of at least one association to create posts.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Create Official Post</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? 'Creating...' : 'Post'}</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                placeholder="Enter post title"
                maxLength={200}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Describe your event or session in detail"
                multiline
                numberOfLines={4}
                maxLength={4000}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Type */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
                {POST_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip,
                      formData.type === type.value && styles.typeChipSelected,
                    ]}
                    onPress={() => updateFormData('type', type.value)}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        formData.type === type.value && styles.typeChipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Start Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Start Date & Time *</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.startAt && styles.inputError]}
                onPress={() => {
                  // Set to tomorrow by default for new events
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(10, 0, 0, 0); // 10 AM
                  updateFormData('startAt', tomorrow);
                }}
              >
                <Text style={styles.dateButtonText}>{formatDateTime(formData.startAt)}</Text>
              </TouchableOpacity>
              <Text style={styles.helperText}>Tap to set to tomorrow 10:00 AM</Text>
              {errors.startAt && <Text style={styles.errorText}>{errors.startAt}</Text>}
            </View>

            {/* End Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>End Date & Time (Optional)</Text>
              <TouchableOpacity
                style={[styles.dateButton, errors.endAt && styles.inputError]}
                onPress={() => {
                  if (!formData.endAt) {
                    // Set end time to 2 hours after start time
                    const endTime = new Date(formData.startAt);
                    endTime.setHours(endTime.getHours() + 2);
                    updateFormData('endAt', endTime);
                  }
                }}
              >
                <Text style={styles.dateButtonText}>
                  {formData.endAt ? formatDateTime(formData.endAt) : 'Tap to set end date (2 hours after start)'}
                </Text>
              </TouchableOpacity>
              {formData.endAt && (
                <TouchableOpacity
                  onPress={() => updateFormData('endAt', null)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
              {errors.endAt && <Text style={styles.errorText}>{errors.endAt}</Text>}
            </View>

            {/* Location */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                value={formData.location}
                onChangeText={(text) => updateFormData('location', text)}
                placeholder="e.g., Main Auditorium, Online, Room 101"
                maxLength={300}
              />
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            {/* Organizer */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Organizer</Text>
              <TextInput
                style={[styles.input, errors.organizer && styles.inputError]}
                value={formData.organizer}
                onChangeText={(text) => updateFormData('organizer', text)}
                placeholder="Organization or person organizing this event"
                maxLength={200}
              />
              {errors.organizer && <Text style={styles.errorText}>{errors.organizer}</Text>}
            </View>

            {/* RSVP URL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>RSVP URL</Text>
              <TextInput
                style={[styles.input, errors.rsvpUrl && styles.inputError]}
                value={formData.rsvpUrl}
                onChangeText={(text) => updateFormData('rsvpUrl', text)}
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.rsvpUrl && <Text style={styles.errorText}>{errors.rsvpUrl}</Text>}
            </View>

            {/* Meeting URL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Meeting URL</Text>
              <TextInput
                style={[styles.input, errors.meetingUrl && styles.inputError]}
                value={formData.meetingUrl}
                onChangeText={(text) => updateFormData('meetingUrl', text)}
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.meetingUrl && <Text style={styles.errorText}>{errors.meetingUrl}</Text>}
            </View>

            {/* Info URL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Info URL</Text>
              <TextInput
                style={[styles.input, errors.infoUrl && styles.inputError]}
                value={formData.infoUrl}
                onChangeText={(text) => updateFormData('infoUrl', text)}
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.infoUrl && <Text style={styles.errorText}>{errors.infoUrl}</Text>}
            </View>

            {/* Banner URL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Banner Image URL</Text>
              <TextInput
                style={[styles.input, errors.bannerUrl && styles.inputError]}
                value={formData.bannerUrl}
                onChangeText={(text) => updateFormData('bannerUrl', text)}
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.bannerUrl && <Text style={styles.errorText}>{errors.bannerUrl}</Text>}
            </View>

            {/* Featured Toggle */}
            <View style={[styles.fieldContainer, styles.switchContainer]}>
              <Text style={styles.label}>Featured Post</Text>
              <Switch
                value={formData.isFeatured}
                onValueChange={(value) => updateFormData('isFeatured', value)}
              />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
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
  typeContainer: {
    flexDirection: 'row',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  typeChipSelected: {
    backgroundColor: '#007AFF',
  },
  typeChipText: {
    fontSize: 14,
    color: '#333',
  },
  typeChipTextSelected: {
    color: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});