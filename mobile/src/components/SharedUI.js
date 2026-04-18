import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T } from '../theme';

export function ShimmerBar({ style }) {
  const anim = useState(() => new Animated.Value(0.35))[0];
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[{ backgroundColor: '#E5E3DD', borderRadius: 6 }, style, { opacity: anim }]} />;
}

export function SkeletonCard() {
  return (
    <View style={skel.card}>
      <View style={skel.row}>
        <ShimmerBar style={skel.icon} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ShimmerBar style={{ width: 80, height: 10, marginBottom: 6 }} />
          <ShimmerBar style={{ width: 140, height: 9 }} />
        </View>
        <ShimmerBar style={{ width: 52, height: 20, borderRadius: 10 }} />
      </View>
      <ShimmerBar style={{ width: '90%', height: 14, marginTop: 14, marginBottom: 8 }} />
      <ShimmerBar style={{ width: '100%', height: 10, marginBottom: 5 }} />
      <ShimmerBar style={{ width: '75%', height: 10 }} />
    </View>
  );
}

export function EmptyState({ isFiltered, message, title }) {
  return (
    <View style={empty.container}>
      <View style={empty.circle}>
        <Feather name={isFiltered ? 'search' : 'book-open'} size={32} color={T.sage} />
      </View>
      <Text style={empty.title}>{title || (isFiltered ? 'No rulings found' : 'Nothing here yet')}</Text>
      <Text style={empty.body}>
        {message || (isFiltered ? 'Try broadening your search or switching the school filter.' : 'Rulings will appear once they are added to the database.')}
      </Text>
    </View>
  );
}

const skel = StyleSheet.create({
  card: { backgroundColor: T.cardBg, borderRadius: T.r, padding: 22, marginBottom: 16, height: 180 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 12 },
});

const empty = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.sageBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 19, fontWeight: '800', color: T.ink, marginBottom: 8, letterSpacing: -0.4 },
  body: { fontSize: 15, color: T.inkMuted, textAlign: 'center', paddingHorizontal: 48, lineHeight: 22 },
});
