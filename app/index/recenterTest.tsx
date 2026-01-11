import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { ScrollView as ScrollViewType } from 'react-native';
import {
  Dimensions,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import Carousel from 'react-native-reanimated-carousel';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import { themeTokens$ } from '@/utils/stateManager';
import { observer } from '@legendapp/state/react';

const { width } = Dimensions.get('window');
const PANES = 5;
const CENTER_INDEX = Math.floor(PANES / 2);

export default observer(function RecenterTest() {
  const { colors, palette } = themeTokens$.get();
  const weekScrollRef = useAnimatedRef<ScrollViewType>();
  const dayListRef = useAnimatedRef<ScrollViewType>();
  const weekLayoutReady = useRef(false);
  const dayLayoutReady = useRef(false);
  const weekReady = useSharedValue(0);
  const dayReady = useSharedValue(0);
  const weekTarget = useSharedValue(-1);
  const dayTarget = useSharedValue(-1);
  const weekRecenterTick = useSharedValue(0);
  const dayRecenterTick = useSharedValue(0);
  const pagerRef = useRef<PagerView | null>(null);
  const swiperRef = useRef<any>(null);
  const [status, setStatus] = useState('idle');
  const [weekIndex, setWeekIndex] = useState<number | null>(null);
  const [dayIndex, setDayIndex] = useState<number | null>(null);

  const logUiScroll = useCallback((label: string, offset: number, tick: number) => {
    if (!__DEV__) return;
    console.log('ui scroll', label, 'offset', Math.round(offset), 'tick', tick);
  }, []);

  const panes = useMemo(() => Array.from({ length: PANES }, (_, i) => i + 1), []);
  const innerRows = useMemo(() => Array.from({ length: 8 }, (_, i) => i + 1), []);

  const runAfterInteractions = useCallback((action: () => void) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(action);
    });
  }, []);

  const weekScrollHandler = useAnimatedScrollHandler({
    onScroll: () => {
      if (!weekReady.value) {
        weekReady.value = 1;
      }
    },
  });

  const dayScrollHandler = useAnimatedScrollHandler({
    onScroll: () => {
      if (!dayReady.value) {
        dayReady.value = 1;
      }
    },
  });

  useAnimatedReaction(
    () => ({ tick: weekRecenterTick.value, ready: weekReady.value }),
    (value, prev) => {
      'worklet';
      if (!value.ready) return;
      if (prev && value.tick === prev.tick) return;
      const offset = weekTarget.value;
      if (offset < 0) return;
      runOnJS(logUiScroll)('week', offset, value.tick);
      scrollTo(weekScrollRef, offset, 0, false);
    },
  );

  useAnimatedReaction(
    () => ({ tick: dayRecenterTick.value, ready: dayReady.value }),
    (value, prev) => {
      'worklet';
      if (!value.ready) return;
      if (prev && value.tick === prev.tick) return;
      const offset = dayTarget.value;
      if (offset < 0) return;
      runOnJS(logUiScroll)('day', offset, value.tick);
      scrollTo(dayListRef, offset, 0, false);
    },
  );

  const recenterWeek = useCallback((reason: string) => {
    runAfterInteractions(() => {
      const layoutReady = weekLayoutReady.current;
      if (__DEV__) {
        console.log('recenter week', reason, 'layout', layoutReady ? 'READY' : 'NO');
      }
      if (!layoutReady) {
        setStatus(`week recenter (${reason}) - no layout`);
        return;
      }
      setStatus(`week recenter (${reason})`);
      weekTarget.value = width * CENTER_INDEX;
      weekRecenterTick.value = weekRecenterTick.value + 1;
    });
  }, [runAfterInteractions, weekScrollRef, weekTarget, weekRecenterTick]);

  const recenterDay = useCallback((reason: string) => {
    runAfterInteractions(() => {
      const layoutReady = dayLayoutReady.current;
      if (__DEV__) {
        console.log('recenter day', reason, 'layout', layoutReady ? 'READY' : 'NO');
      }
      if (!layoutReady) {
        setStatus(`day recenter (${reason}) - no layout`);
        return;
      }
      setStatus(`day recenter (${reason})`);
      dayTarget.value = width * CENTER_INDEX;
      dayRecenterTick.value = dayRecenterTick.value + 1;
    });
  }, [runAfterInteractions, dayListRef, dayTarget, dayRecenterTick]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.base }]}>
      <Text style={[styles.title, { color: colors.textStrong }]}>Recenter Test</Text>
      <Text style={[styles.meta, { color: colors.subtext1 }]}>status: {status}</Text>
      <Text style={[styles.meta, { color: colors.subtext1 }]}>
        week idx: {weekIndex ?? '-'} day idx: {dayIndex ?? '-'}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => recenterWeek('button')}>
          <Text style={[styles.buttonText, { color: colors.textStrong }]}>Recenter Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => recenterDay('button')}>
          <Text style={[styles.buttonText, { color: colors.textStrong }]}>Recenter Day</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Week Scroll (1-5)</Text>
        <Animated.ScrollView
          ref={weekScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: width * CENTER_INDEX, y: 0 }}
          contentContainerStyle={{ width: width * PANES }}
          onLayout={() => {
            weekLayoutReady.current = true;
            recenterWeek('layout');
          }}
          onContentSizeChange={() => {
            weekLayoutReady.current = true;
            recenterWeek('content');
          }}
          onScroll={weekScrollHandler}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setWeekIndex(idx);
            if (idx !== CENTER_INDEX) {
              recenterWeek('momentum');
            } else {
              setStatus(`week end idx=${idx}`);
            }
          }}
          onScrollEndDrag={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setWeekIndex(idx);
            if (idx !== CENTER_INDEX) {
              recenterWeek('drag');
            } else {
              setStatus(`week drag end idx=${idx}`);
            }
          }}
          scrollEventThrottle={16}
          style={styles.scrollFrame}
        >
          {panes.map((pane) => (
            <View key={`week-${pane}`} style={[styles.pane, { backgroundColor: colors.surface1 }]}>
              <Text style={[styles.paneText, { color: colors.text }]}>{pane}</Text>
            </View>
          ))}
        </Animated.ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Day List (1-5)</Text>
        <Animated.ScrollView
          ref={dayListRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: width * CENTER_INDEX, y: 0 }}
          contentContainerStyle={{ width: width * PANES }}
          onLayout={() => {
            dayLayoutReady.current = true;
            recenterDay('layout');
          }}
          onContentSizeChange={() => {
            dayLayoutReady.current = true;
            recenterDay('content');
          }}
          onScroll={dayScrollHandler}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setDayIndex(idx);
            if (idx !== CENTER_INDEX) {
              recenterDay('momentum');
            } else {
              setStatus(`day end idx=${idx}`);
            }
          }}
          onScrollEndDrag={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setDayIndex(idx);
            if (idx !== CENTER_INDEX) {
              recenterDay('drag');
            } else {
              setStatus(`day drag end idx=${idx}`);
            }
          }}
          scrollEventThrottle={16}
          style={styles.listFrame}
        >
          {panes.map((item) => (
            <View key={`day-${item}`} style={[styles.dayPane, { backgroundColor: colors.surface1 }]}>
              <Text style={[styles.paneText, { color: colors.text }]}>{item}</Text>
              <ScrollView
                style={styles.innerScroll}
                contentContainerStyle={styles.innerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {innerRows.map((row) => (
                  <View key={`row-${item}-${row}`} style={styles.innerRow}>
                    <Text style={[styles.innerRowText, { color: colors.subtext1 }]}>
                      Pane {item} row {row}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </Animated.ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>PagerView Snap (1-5)</Text>
        <PagerView
          ref={pagerRef}
          style={styles.pagerFrame}
          initialPage={CENTER_INDEX}
          onPageSelected={(e) => {
            const idx = e.nativeEvent.position;
            setStatus(`pager idx=${idx}`);
            if (idx !== CENTER_INDEX) {
              pagerRef.current?.setPageWithoutAnimation(CENTER_INDEX);
            }
          }}
        >
          {panes.map((pane) => (
            <View key={`pager-${pane}`} style={[styles.pane, { backgroundColor: colors.surface1 }]}>
              <Text style={[styles.paneText, { color: colors.text }]}>{pane}</Text>
            </View>
          ))}
        </PagerView>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reanimated Carousel (1-5)</Text>
        <Carousel
          width={width}
          height={120}
          data={panes}
          loop
          pagingEnabled
          onSnapToItem={(index) => setStatus(`carousel idx=${index}`)}
          renderItem={({ item }) => (
            <View style={[styles.pane, { backgroundColor: colors.surface1 }]}>
              <Text style={[styles.paneText, { color: colors.text }]}>{item}</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>SwiperFlatList Snap (1-5)</Text>
        <SwiperFlatList
          ref={swiperRef}
          data={panes}
          index={CENTER_INDEX}
          showPagination={false}
          onChangeIndex={({ index }) => {
            setStatus(`swiper idx=${index}`);
            if (index !== CENTER_INDEX) {
              swiperRef.current?.scrollToIndex?.({ index: CENTER_INDEX, animated: false });
            }
          }}
          renderItem={({ item }) => (
            <View style={[styles.pane, { backgroundColor: colors.surface1 }]}>
              <Text style={[styles.paneText, { color: colors.text }]}>{item}</Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollFrame: {
    height: 120,
  },
  listFrame: {
    height: 220,
  },
  pagerFrame: {
    width,
    height: 120,
  },
  pane: {
    width,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paneText: {
    fontSize: 28,
    fontWeight: '700',
  },
  dayPane: {
    width,
    height: 220,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  innerScroll: {
    flex: 1,
    marginTop: 8,
  },
  innerScrollContent: {
    paddingBottom: 12,
  },
  innerRow: {
    paddingVertical: 6,
  },
  innerRowText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
