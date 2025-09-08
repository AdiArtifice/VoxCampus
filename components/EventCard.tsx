import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

type EventCardProps = {
  title: string;
  image?: string;
  onPress?: () => void;
};

const EventCard: React.FC<EventCardProps> = ({ title, image, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <Image 
        source={image ? { uri: image } : require('@/assets/images/grid.png')} 
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 122,
    height: 166,
    borderRadius: SIZES.borderRadius.lg,
    overflow: 'hidden',
    marginRight: SIZES.md
  },
  image: {
    width: '100%',
    height: '100%'
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: SIZES.sm
  },
  title: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.white
  }
});

export default EventCard;
