import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../styles';

type ToastType = 'success' | 'error';

type ToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
};

export const Toast = ({ visible, message, type = 'success', duration = 2000, onHide }: ToastProps) => {
  const [isHidden, setIsHidden] = useState(!visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Reset isHidden when visible becomes true
      setIsHidden(false);
      // Reset animation values
      opacity.setValue(0);
      translateY.setValue(-20);
      
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsHidden(true);
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else if (!visible) {
      setIsHidden(true);
    }
  }, [visible, duration, onHide]);

  if (isHidden) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        type === 'error' ? styles.errorContainer : styles.successContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  successContainer: {
    backgroundColor: colors.success,
  },
  errorContainer: {
    backgroundColor: colors.danger,
  },
  message: {
    color: '#FFFFFF',
    fontSize: typography.size.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
