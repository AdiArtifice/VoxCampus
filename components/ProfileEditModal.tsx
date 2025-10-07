import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';
import { Button } from './Button';
import type {
  ProfileEducation,
  ProfileProject,
  ProfileSocialLinks,
} from '@/context/AuthContext';

export type ProfileFormValues = {
  name: string;
  bio: string;
  education: ProfileEducation;
  skills: string[];
  projects: ProfileProject[];
  socialLinks: ProfileSocialLinks;
  achievements: string[];
};

type Props = {
  visible: boolean;
  saving?: boolean;
  initialValues: ProfileFormValues;
  onClose: () => void;
  onSave: (values: ProfileFormValues) => Promise<void> | void;
};

type EditableProject = ProfileProject & { id: string };

const buildProjectsState = (projects: ProfileProject[]): EditableProject[] =>
  projects.length
    ? projects.map((project, index) => ({ ...project, id: `${index}` }))
    : [{ id: '0', title: '', description: '', link: '' }];

export const ProfileEditModal: React.FC<Props> = ({ visible, saving = false, initialValues, onClose, onSave }) => {
  const [name, setName] = useState(initialValues.name ?? '');
  const [bio, setBio] = useState(initialValues.bio ?? '');
  const [education, setEducation] = useState<ProfileEducation>(initialValues.education ?? {});
  const [skillsInput, setSkillsInput] = useState('');
  const [projects, setProjects] = useState<EditableProject[]>(buildProjectsState(initialValues.projects ?? []));
  const [socialLinks, setSocialLinks] = useState<ProfileSocialLinks>(initialValues.socialLinks ?? {});
  const [achievementsInput, setAchievementsInput] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(initialValues.name ?? '');
    setBio(initialValues.bio ?? '');
    setEducation(initialValues.education ?? {});
    setSkillsInput((initialValues.skills ?? []).join(', '));
    setProjects(buildProjectsState(initialValues.projects ?? []));
    setSocialLinks(initialValues.socialLinks ?? {});
    setAchievementsInput((initialValues.achievements ?? []).join(', '));
  }, [visible, initialValues]);

  const skillsList = useMemo(
    () =>
      skillsInput
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    [skillsInput]
  );

  const achievementsList = useMemo(
    () =>
      achievementsInput
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    [achievementsInput]
  );

  const updateProject = (id: string, field: keyof ProfileProject, value: string) => {
    setProjects(prev =>
      prev.map(project => (project.id === id ? { ...project, [field]: value } : project))
    );
  };

  const addProjectRow = () => {
    setProjects(prev => [...prev, { id: `${Date.now()}`, title: '', description: '', link: '' }]);
  };

  const removeProject = (id: string) => {
    setProjects(prev => {
      const next = prev.filter(project => project.id !== id);
      return next.length ? next : [{ id: '0', title: '', description: '', link: '' }];
    });
  };

  const handleSave = () => {
    const sanitizedProjects = projects
      .map(({ id, ...project }) => project)
      .filter(project => project.title?.trim());

    const payload: ProfileFormValues = {
      name: name.trim(),
      bio: bio.trim(),
      education,
      skills: skillsList,
      projects: sanitizedProjects,
      socialLinks,
      achievements: achievementsList,
    };

    onSave(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Edit Profile</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell everyone about yourself"
                style={[styles.input, styles.textArea]}
                multiline
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.subLabel}>Program / Degree</Text>
              <TextInput
                value={education?.program ?? ''}
                onChangeText={text => setEducation(prev => ({ ...prev, program: text }))}
                placeholder="e.g. B.Tech in AIML"
                style={styles.input}
              />
            </View>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.subLabel}>Department</Text>
                <TextInput
                  value={education?.department ?? ''}
                  onChangeText={text => setEducation(prev => ({ ...prev, department: text }))}
                  placeholder="e.g. Computer Science"
                  style={styles.input}
                />
              </View>
              <View style={[styles.fieldGroup, styles.fieldHalf]}>
                <Text style={styles.subLabel}>Year</Text>
                <TextInput
                  value={education?.year ?? ''}
                  onChangeText={text => setEducation(prev => ({ ...prev, year: text }))}
                  placeholder="e.g. 3rd Year"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Skills (comma separated)</Text>
              <TextInput
                value={skillsInput}
                onChangeText={setSkillsInput}
                placeholder="React Native, Python, Machine Learning"
                style={styles.input}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
              <TouchableOpacity onPress={addProjectRow}>
                <Text style={styles.addButton}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {projects.map(project => (
              <View key={project.id} style={styles.projectCard}>
                <View style={[styles.fieldGroup, { marginBottom: SIZES.xs }]}> 
                  <Text style={styles.subLabel}>Project Title</Text>
                  <TextInput
                    value={project.title}
                    onChangeText={text => updateProject(project.id, 'title', text)}
                    placeholder="Project name"
                    style={styles.input}
                  />
                </View>
                <View style={[styles.fieldGroup, { marginBottom: SIZES.xs }]}> 
                  <Text style={styles.subLabel}>Description</Text>
                  <TextInput
                    value={project.description ?? ''}
                    onChangeText={text => updateProject(project.id, 'description', text)}
                    placeholder="What did you build?"
                    style={[styles.input, styles.textArea, { minHeight: 60 }]}
                    multiline
                  />
                </View>
                <View style={styles.fieldGroup}> 
                  <Text style={styles.subLabel}>Link</Text>
                  <TextInput
                    value={project.link ?? ''}
                    onChangeText={text => updateProject(project.id, 'link', text)}
                    placeholder="https://"
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity onPress={() => removeProject(project.id)} style={styles.removeButton}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Social Links</Text>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.subLabel}>GitHub</Text>
              <TextInput
                value={socialLinks.github ?? ''}
                onChangeText={text => setSocialLinks(prev => ({ ...prev, github: text }))}
                placeholder="https://github.com/username"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.subLabel}>LinkedIn</Text>
              <TextInput
                value={socialLinks.linkedin ?? ''}
                onChangeText={text => setSocialLinks(prev => ({ ...prev, linkedin: text }))}
                placeholder="https://linkedin.com/in/username"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.subLabel}>Portfolio / Website</Text>
              <TextInput
                value={socialLinks.portfolio ?? ''}
                onChangeText={text => setSocialLinks(prev => ({ ...prev, portfolio: text }))}
                placeholder="https://your-site.com"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Achievements (comma separated)</Text>
              <TextInput
                value={achievementsInput}
                onChangeText={setAchievementsInput}
                placeholder="Hackathon Winner, Published Research"
                style={styles.input}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Button text={saving ? 'Saving…' : 'Save Changes'} onPress={handleSave} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.borderRadius.lg,
    borderTopRightRadius: SIZES.borderRadius.lg,
    maxHeight: '90%',
    paddingBottom: SIZES.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    color: COLORS.black,
  },
  scroll: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.lg,
  },
  fieldGroup: {
    marginBottom: SIZES.md,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.black,
    marginBottom: SIZES.xs,
  },
  subLabel: {
  fontFamily: FONTS.regular,
  fontSize: 14,
  color: '#3A3A3A',
    marginBottom: SIZES.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.borderRadius.sm,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.black,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
    marginBottom: SIZES.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.black,
  },
  addButton: {
    fontFamily: FONTS.body,
    color: COLORS.primary,
    fontSize: 14,
  },
  projectCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: SIZES.borderRadius.md,
    padding: SIZES.sm,
    marginBottom: SIZES.md,
    backgroundColor: '#FAFAFA',
  },
  removeButton: {
    alignSelf: 'flex-end',
    marginTop: SIZES.xs,
  },
  removeText: {
    color: COLORS.error,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  fieldHalf: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.sm,
  },
  cancelButton: {
    paddingVertical: SIZES.xs,
    paddingHorizontal: SIZES.sm,
  },
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default ProfileEditModal;
