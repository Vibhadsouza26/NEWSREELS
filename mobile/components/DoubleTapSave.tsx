import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { TapGestureHandler, State, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

interface Props {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  height: number;
}

export default function DoubleTapSave({ children, onDoubleTap, onSingleTap, height }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const doubleTapRef = useRef<TapGestureHandler>(null);
  const singleTapRef = useRef<TapGestureHandler>(null);

  const handleDoubleTap = useCallback((event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      onDoubleTap();

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

  const handleSingleTap = useCallback((event: TapGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE && onSingleTap) {
      onSingleTap();
    }
  }, [onSingleTap]);

  return (
    <TapGestureHandler
      ref={doubleTapRef}
      numberOfTaps={2}
      onHandlerStateChange={handleDoubleTap}
    >
      <TapGestureHandler
        ref={singleTapRef}
        numberOfTaps={1}
        onHandlerStateChange={handleSingleTap}
        waitFor={doubleTapRef}
      >
        <View style={{ height, width: '100%' }}>
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
    </TapGestureHandler>
  );
}

const styles = StyleSheet.create({
  heart: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    marginLeft: -40,
    fontSize: 80,
    color: '#fff',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
    pointerEvents: 'none',
  },
});
