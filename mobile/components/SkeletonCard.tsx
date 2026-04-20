import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

export default function SkeletonCard() {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={[styles.card, { height: screenHeight, width: screenWidth }]}>
      <Animated.View style={[styles.imagePlaceholder, { opacity, height: screenHeight * 0.4 }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.pill, { opacity }]} />
        <Animated.View style={[styles.titleLine, { opacity, width: '90%' }]} />
        <Animated.View style={[styles.titleLine, { opacity, width: '70%' }]} />
        <Animated.View style={[styles.descLine, { opacity, width: '100%' }]} />
        <Animated.View style={[styles.descLine, { opacity, width: '80%' }]} />
        <Animated.View style={[styles.descLine, { opacity, width: '60%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a',
  },
  imagePlaceholder: {
    backgroundColor: '#222',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  pill: {
    width: 80,
    height: 24,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  titleLine: {
    height: 22,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  descLine: {
    height: 14,
    backgroundColor: '#222',
    borderRadius: 4,
  },
});
