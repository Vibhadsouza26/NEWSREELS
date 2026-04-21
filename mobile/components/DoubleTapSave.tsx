import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { TapGestureHandler, State, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

interface Props {
  children: React.ReactNode;
  onDoubleTap: () => void;
}

export default function DoubleTapSave({ children, onDoubleTap }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handleDoubleTap = useCallback((event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      onDoubleTap();

      // Reset
      scale.setValue(0);
      opacity.setValue(1);

      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [onDoubleTap, scale, opacity]);

  return (
    <TapGestureHandler numberOfTaps={2} onHandlerStateChange={handleDoubleTap}>
      <View style={styles.wrapper}>
        {children}
        <Animated.Text
          style={[
            styles.heart,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
          pointerEvents="none"
        >
          ♥
        </Animated.Text>
      </View>
    </TapGestureHandler>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
  },
  heart: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -40,
    fontSize: 80,
    color: '#fff',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
});
