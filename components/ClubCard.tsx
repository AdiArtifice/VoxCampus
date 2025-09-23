import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

type ClubCardProps = {
  name: string;
  logo?: string;
  onPress?: () => void;
  showName?: boolean; // optional: hide name text when false
  smallName?: boolean; // optional: render smaller name text
};

const ClubCard: React.FC<ClubCardProps> = ({ name, logo, onPress, showName = true, smallName = false }) => {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.logoContainer}>
        {logo && !failed ? (
          <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" onError={handleError} />
        ) : (
          <View style={styles.logoPlaceholder} />
        )}
      </View>
      {showName ? (
        <Text style={[styles.name, smallName && styles.nameSmall]} numberOfLines={2}>{name}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90,
    marginRight: SIZES.md,
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 83,
    borderRadius: SIZES.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    marginBottom: SIZES.xs,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: '100%',
    height: '100%'
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    textAlign: 'center',
    color: COLORS.black
  },
  nameSmall: {
    fontSize: 12
  }
});

export default ClubCard;
