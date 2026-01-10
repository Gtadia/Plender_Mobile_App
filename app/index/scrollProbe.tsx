import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function ScrollProbe() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [refInfo, setRefInfo] = useState('null');
  const [canScrollTo, setCanScrollTo] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const node = scrollRef.current;
      setRefInfo(node ? `${typeof node} keys:${Object.keys(node as any).length}` : 'null');
      setCanScrollTo(typeof (node as any)?.scrollTo === 'function');
      if (node || attempts > 10) {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: width, animated: false });
    }, 500);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scroll Probe</Text>
      <Text style={styles.meta}>ref: {refInfo}</Text>
      <Text style={styles.meta}>scrollTo: {canScrollTo ? 'yes' : 'no'}</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator
        contentOffset={{ x: width, y: 0 }}
        style={styles.scrollFrame}
      >
        <View style={[styles.pane, styles.paneA]}>
          <Text style={styles.paneText}>Pane 0</Text>
        </View>
        <View style={[styles.pane, styles.paneB]}>
          <Text style={styles.paneText}>Pane 1</Text>
        </View>
        <View style={[styles.pane, styles.paneC]}>
          <Text style={styles.paneText}>Pane 2</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  scrollFrame: {
    height: 160,
    marginTop: 12,
  },
  pane: {
    width,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paneText: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  paneA: {
    backgroundColor: '#374151',
  },
  paneB: {
    backgroundColor: '#4b5563',
  },
  paneC: {
    backgroundColor: '#6b7280',
  },
});
