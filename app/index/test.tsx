import React, { useMemo, useRef } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { Text, ScreenView } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const BOX_WIDTH = width; // show 3 boxes at once

export default function TestOverflow() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<any>>(null);

  const base = useMemo(() => [1, 2, 3, 4, 5], []);
  // repeat base so we can recenter without losing middle = 3
  const data = useMemo(() => [...base, ...base, ...base], [base]); // length 15
  const centerIndex = base.length + 2; // middle of middle block points at value 3

  const scrollTo = (idx: number) => {
    listRef.current?.scrollToIndex({ index: idx, animated: false });
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / BOX_WIDTH);
    const blockSize = base.length;
    // if near left edge of first block, jump forward a block
    if (idx < blockSize - 2) {
      scrollTo(idx + blockSize);
    } else if (idx > data.length - blockSize + 1) {
      // near right edge of last block, jump back a block
      scrollTo(idx - blockSize);
    }
  };

  return (
    <ScreenView style={styles.container}>
      <View style={[styles.titleContainer, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Overflow Test</Text>
        <Text style={styles.subtitle}>FlatList; middle value stays centered on recenter</Text>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={BOX_WIDTH}
        snapToAlignment="center"
        pagingEnabled
        decelerationRate="fast"
        bounces={false}
        initialScrollIndex={centerIndex}
        getItemLayout={(_, index) => ({
          length: BOX_WIDTH,
          offset: BOX_WIDTH * index,
          index,
        })}
        keyExtractor={(_, idx) => `box-${idx}`}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <View style={[styles.box, { width: BOX_WIDTH }]}>
            <Text style={styles.boxText}>{item}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </ScreenView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  titleContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    alignItems: 'center',
  },
  box: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  boxText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
  },
});
