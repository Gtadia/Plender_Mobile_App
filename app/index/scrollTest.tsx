import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, InteractionManager, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenView } from '@/components/Themed';
import { themeTokens$ } from '@/utils/stateManager';
import { observer } from '@legendapp/state/react';

const { width } = Dimensions.get('window');
const PANES = 5;
const CENTER_INDEX = Math.floor(PANES / 2);

export default observer(function ScrollTest() {
  const { colors, palette } = themeTokens$.get();
  const scrollRef = useRef<ScrollView | null>(null);
  const listRef = useRef<ScrollView | null>(null);
  const didInitScrollRef = useRef(false);
  const didInitListRef = useRef(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [listOffset, setListOffset] = useState(0);
  const [lockScroll, setLockScroll] = useState(true);
  const [lockList, setLockList] = useState(true);
  const [scrollClicks, setScrollClicks] = useState(0);
  const [scrollUIClicks, setScrollUIClicks] = useState(0);
  const [scrollForceClicks, setScrollForceClicks] = useState(0);
  const [listClicks, setListClicks] = useState(0);
  const [listUIClicks, setListUIClicks] = useState(0);
  const [listForceClicks, setListForceClicks] = useState(0);
  const [scrollToAvailable, setScrollToAvailable] = useState(false);
  const [listToAvailable, setListToAvailable] = useState(false);
  const [scrollRefInfo, setScrollRefInfo] = useState('null');
  const [listRefInfo, setListRefInfo] = useState('null');

  const panes = useMemo(() => Array.from({ length: PANES }, (_, i) => i), []);
  const listData = useMemo(() => Array.from({ length: 3 }, (_, i) => i), []);

  const scrollToCenter = useCallback((animated = false) => {
    scrollRef.current?.scrollTo({ x: width * CENTER_INDEX, animated });
  }, []);

  const listToCenter = useCallback((animated = false) => {
    listRef.current?.scrollTo({ x: width, animated });
  }, []);

  const forceScrollCenterNative = useCallback(() => {
    const node = scrollRef.current as any;
    node?.scrollTo?.({ x: width * CENTER_INDEX, animated: false });
    node?.getNode?.()?.scrollTo?.({ x: width * CENTER_INDEX, animated: false });
    node?.scrollResponderScrollTo?.({ x: width * CENTER_INDEX, y: 0, animated: false });
    node?.setNativeProps?.({ contentOffset: { x: width * CENTER_INDEX, y: 0 } });
  }, []);

  const forceListCenterNative = useCallback(() => {
    const node = listRef.current as any;
    node?.scrollTo?.({ x: width, animated: false });
    node?.getNode?.()?.scrollTo?.({ x: width, animated: false });
    node?.scrollResponderScrollTo?.({ x: width, y: 0, animated: false });
    node?.setNativeProps?.({ contentOffset: { x: width, y: 0 } });
  }, []);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const scrollNode = scrollRef.current;
      const listNode = listRef.current;
      setScrollRefInfo(scrollNode ? `${typeof scrollNode} keys:${Object.keys(scrollNode as any).length}` : 'null');
      setListRefInfo(listNode ? `${typeof listNode} keys:${Object.keys(listNode as any).length}` : 'null');
      setScrollToAvailable(typeof (scrollNode as any)?.scrollTo === 'function');
      setListToAvailable(typeof (listNode as any)?.scrollTo === 'function');
      if ((scrollNode && listNode) || attempts > 10) {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      scrollToCenter(false);
      listToCenter(false);
    });
    return () => task.cancel();
  }, [listToCenter, scrollToCenter]);

  // IMPORTANT!!!! — I made the main view a scrollable and also made the list of buttons a column list. Please do not touch them right now
  return (
    <ScreenView style={[styles.container, { backgroundColor: palette.base }]}>
      <Text style={[styles.title, { color: colors.textStrong }]}>Scroll Test</Text>
      <ScrollView>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ScrollView (5 panes)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => {
                setScrollClicks((v) => v + 1);
                scrollToCenter();
              }}
            >
              <Text style={[styles.buttonText, { color: palette.base }]}>Scroll to Center</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => {
                setScrollUIClicks((v) => v + 1);
                scrollToCenter();
              }}
            >
              <Text style={[styles.buttonText, { color: palette.base }]}>JS Center</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => {
                setScrollForceClicks((v) => v + 1);
                forceScrollCenterNative();
              }}
            >
              <Text style={[styles.buttonText, { color: palette.base }]}>Force Native</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: lockScroll ? colors.text : colors.surface1 }]}
              onPress={() => setLockScroll((prev) => !prev)}
            >
              <Text style={[styles.buttonText, { color: lockScroll ? palette.base : colors.text }]}>
                {lockScroll ? 'Lock Center' : 'Unlock'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              offset: {Math.round(scrollOffset)}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              scrollTo: {scrollToAvailable ? 'yes' : 'no'}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              ref: {scrollRefInfo}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              clicks: {scrollClicks}/{scrollUIClicks}/{scrollForceClicks}
            </Text>
          </ScrollView>
        <ScrollView
          ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: width * CENTER_INDEX, y: 0 }}
            onScroll={(e) => {
              setScrollOffset(e.nativeEvent.contentOffset.x);
              if (lockScroll) {
                scrollToCenter(false);
              }
            }}
            scrollEventThrottle={16}
            onLayout={() => {
              if (didInitScrollRef.current) return;
              didInitScrollRef.current = true;
              scrollToCenter(false);
              setTimeout(() => scrollToCenter(false), 0);
            }}
            onContentSizeChange={() => {
              scrollToCenter(false);
            }}
            style={styles.scrollFrame}
          >
            {panes.map((pane) => (
              <View key={pane} style={[styles.pane, { backgroundColor: colors.surface1 }]}>
                <Text style={[styles.paneText, { color: colors.text }]}>Pane {pane}</Text>
              </View>
            ))}
        </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ScrollView (3 panes)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => {
                setListClicks((v) => v + 1);
                listToCenter();
              }}
            >
              <Text style={[styles.buttonText, { color: palette.base }]}>Scroll to Center</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => {
                setListUIClicks((v) => v + 1);
                listToCenter();
              }}
            >
              <Text style={[styles.buttonText, { color: palette.base }]}>JS Center</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => {
                setListForceClicks((v) => v + 1);
                forceListCenterNative();
              }}
            >
              <Text style={[styles.buttonText, { color: palette.base }]}>Force Native</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: lockList ? colors.text : colors.surface1 }]}
              onPress={() => setLockList((prev) => !prev)}
            >
              <Text style={[styles.buttonText, { color: lockList ? palette.base : colors.text }]}>
                {lockList ? 'Lock Center' : 'Unlock'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              offset: {Math.round(listOffset)}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              scrollTo: {listToAvailable ? 'yes' : 'no'}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              ref: {listRefInfo}
            </Text>
            <Text style={[styles.meta, { color: colors.subtext1 }]}>
              clicks: {listClicks}/{listUIClicks}/{listForceClicks}
            </Text>
          </ScrollView>
        <ScrollView
          ref={listRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: width, y: 0 }}
            onScroll={(e) => {
              setListOffset(e.nativeEvent.contentOffset.x);
              if (lockList) {
                listToCenter(false);
              }
            }}
            scrollEventThrottle={16}
            style={styles.scrollFrame}
            onLayout={() => {
              if (didInitListRef.current) return;
              didInitListRef.current = true;
              listToCenter(false);
              setTimeout(() => listToCenter(false), 0);
            }}
            onContentSizeChange={() => {
              listToCenter(false);
            }}
          >
            {listData.map((pane) => (
              <View key={pane} style={[styles.pane, { backgroundColor: colors.surface1 }]}>
                <Text style={[styles.paneText, { color: colors.text }]}>Pane {pane}</Text>
              </View>
            ))}
        </ScrollView>
        </View>
      </ScrollView>
    </ScreenView>
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
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollFrame: {
    height: 140,
  },
  pane: {
    width,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paneText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
