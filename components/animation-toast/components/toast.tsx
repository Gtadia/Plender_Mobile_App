import {StyleSheet, Text, View} from 'react-native';
import React, {
  useEffect,
  useState,
} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { Portal } from 'react-native-portalize';
import LottiesView from './lottiesView';
import {getStyles} from '../utils';
import { toastShow$ } from '../toastStore';


interface ToastProps {
  type?: 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  duration: number;
}

const Toast = () => {
  const toastTopAnimation = useSharedValue(-100);
  const [state, setState] = useState({
    title: '',
    isShow: false,
    type: '',
    description: '',
  });

  const updateState = (newState: object) => {
    setState((prevState: any) => ({
      ...prevState,
      ...newState,
    }));
  };

  const insets = useSafeAreaInsets();
  const {backgroundColor, titleColor, descriptionColor, animationSource} =
    getStyles(state.type);

  useEffect(() => {
    const dispose = toastShow$.onChange(({ value }) => {
      updateState({
        isShow: true,
        title: value.title,
        description: value.description,
        type: value.type
      });

      const duration = 2000;
      toastTopAnimation.value = withSequence(
          withTiming(Math.max(Number(insets?.top), 15)),
          withDelay(
            duration,
            withTiming(-100, undefined, finish => {
              if (finish) {
                runOnJS(() => {
                  updateState({
                    isShow: false,
                  });
                });
              }
            }),
          ),
        );
    });

    return () => dispose();
  }, [insets?.top, toastTopAnimation]);

  const animatedTopStyles = useAnimatedStyle(() => {
    return {
      top: toastTopAnimation.value,
    };
  });

  return (
    <Portal>
      {state.isShow && (
        <Animated.View
          style={[styles.toastContainer, {backgroundColor}, animatedTopStyles]}>
          {animationSource && (
            <LottiesView
              animationStyle={styles.icon}
              animationViewStyle={styles.icon}
              source={animationSource}
              loop={false}
              speed={2.5}
            />
          )}
          <View style={styles.titleCard}>
            <Text style={[styles.title, {color: titleColor}]}>
              {state?.title}
            </Text>
            {state.description && (
              <Text style={[styles.description, {color: descriptionColor}]}>
                {state.description}
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </Portal>
  );
};

export default Toast;

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    paddingVertical: 8,
    paddingHorizontal: 25,
    marginHorizontal: 15,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 1000,
    zIndex: 1000,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleCard: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  description: {
    fontSize: 10,
    fontWeight: '500',
  },
  icon: {
    width: 30,
    height: 30,
  },
});
