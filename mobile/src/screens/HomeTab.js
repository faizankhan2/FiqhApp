import { useState, useMemo, useCallback } from 'react';
import { FlatList, LayoutAnimation, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T } from '../theme';
import { SituationCard } from '../components/SituationCard';
import { RulingCard } from '../components/RulingCard';
import { SkeletonCard, EmptyState } from '../components/SharedUI';

const SITUATIONS = [
  {
    id: 'daily',
    title: 'Daily Essentials',
    subtitle: 'Wudu, Salah, Fasting',
    icon: 'sun',
    color: T.pastelBlue,
    filter: (r) => ['Purification', 'Prayer', 'Fasting'].includes(r.module)
  },
  {
    id: 'travel',
    title: 'I am Traveling',
    subtitle: 'Journey, Prayers, Food',
    icon: 'navigation',
    color: T.pastelGreen,
    filter: (r) => (r.scenario_tags || []).some(t => ['travel', 'traveling', 'journey'].includes(t.toLowerCase()))
  },
  {
    id: 'sick',
    title: 'I am Sick',
    subtitle: 'Health & Concessions',
    icon: 'activity',
    color: T.pastelBeige,
    filter: (r) => (r.scenario_tags || []).some(t => ['sick', 'sickness', 'illness', 'health', 'medicine'].includes(t.toLowerCase()))
  },
  {
    id: 'business',
    title: 'Business & Money',
    subtitle: 'Zakat, Trade, Finance',
    icon: 'dollar-sign',
    color: T.pastelPurple,
    filter: (r) => (r.scenario_tags || []).some(t => ['zakat', 'finance', 'money', 'business', 'trade'].includes(t.toLowerCase()))
  }
];

export default function HomeTab({ rulings, loading }) {
  const [activeSit, setActiveSit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let r = rulings;
    if (activeSit) r = r.filter(activeSit.filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((x) => (x.title && x.title.toLowerCase().includes(q)) || (x.short_rule && x.short_rule.toLowerCase().includes(q)));
    }
    return r;
  }, [rulings, searchQuery, activeSit]);

  const selectSit = useCallback((sit) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSit(sit);
  }, []);

  const clearFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSit(null);
    setSearchQuery('');
  }, []);

  const isFinderView = !activeSit && searchQuery.trim() === '';

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {isFinderView ? (
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>Assalamu Alaikum</Text>
            <Text style={styles.greetingSubtitle}>Let us find ease in your worship today.</Text>
          </View>
        ) : (
          <View style={styles.resultsHeader}>
            <TouchableOpacity onPress={clearFilters} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={T.sage} />
            </TouchableOpacity>
            <View>
              <Text style={styles.resultsTitle}>{activeSit ? activeSit.title : 'Search Results'}</Text>
              <Text style={styles.resultsCount}>{filtered.length} rulings found</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Search Bar ── */}
      <View style={[styles.searchBarContainer, !isFinderView && styles.searchBarContainerSmall]}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={T.inkMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a situation..."
            placeholderTextColor={T.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {loading ? (
          <View><SkeletonCard /><SkeletonCard /></View>
        ) : isFinderView ? (
          <View style={styles.gridContainer}>
            <Text style={styles.gridLabel}>Common Life Situations</Text>
            <View style={styles.grid}>
              {SITUATIONS.map(sit => <SituationCard key={sit.id} situation={sit} onPress={selectSit} />)}
            </View>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RulingCard item={item} />}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState isFiltered={true} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 20 },
  greetingBlock: { marginBottom: 10 },
  greetingTitle: { fontSize: 28, fontWeight: '800', color: T.ink, letterSpacing: -0.5 },
  greetingSubtitle: { fontSize: 15, color: T.inkSoft, marginTop: 4, fontWeight: '500' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12, ...T.shadow },
  resultsTitle: { fontSize: 20, fontWeight: '700', color: T.ink },
  resultsCount: { fontSize: 13, color: T.inkMuted, marginTop: 1 },
  searchBarContainer: { paddingHorizontal: 24, marginBottom: 24 },
  searchBarContainerSmall: { marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: T.border, ...T.shadow },
  searchInput: { flex: 1, fontSize: 15, color: T.ink },
  content: { flex: 1, paddingHorizontal: 24 },
  gridContainer: { flex: 1 },
  gridLabel: { fontSize: 12, fontWeight: '800', color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
});
