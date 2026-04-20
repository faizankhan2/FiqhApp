import { useState, useMemo, useCallback } from 'react';
import { SectionList, LayoutAnimation, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    filter: (r) => {
      const mod = (r.module || '').toLowerCase();
      const topic = (r.topic || '').toLowerCase();
      return mod.includes('purification') || mod.includes('prayer') || mod.includes('fasting') || mod.includes('salah') || topic.includes('salah') || topic.includes('wudu');
    }
  },
  {
    id: 'travel',
    title: 'I am Traveling',
    subtitle: 'Journey, Prayers, Food',
    icon: 'navigation',
    color: T.pastelGreen,
    filter: (r) => {
      const tags = (r.scenario_tags || []).map(t => t.toLowerCase());
      const title = (r.title || '').toLowerCase();
      return tags.some(t => ['travel', 'traveling', 'journey', 'qasr'].includes(t)) || title.includes('travel');
    }
  },
  {
    id: 'sick',
    title: 'I am Sick',
    subtitle: 'Health & Concessions',
    icon: 'activity',
    color: T.pastelBeige,
    filter: (r) => {
      const tags = (r.scenario_tags || []).map(t => t.toLowerCase());
      const mod = (r.module || '').toLowerCase();
      return tags.some(t => ['sick', 'sickness', 'illness', 'health', 'medicine', 'injury'].includes(t)) || mod.includes('medical');
    }
  },
  {
    id: 'business',
    title: 'Business & Money',
    subtitle: 'Zakat, Trade, Finance',
    icon: 'dollar-sign',
    color: T.pastelPurple,
    filter: (r) => {
      const tags = (r.scenario_tags || []).map(t => t.toLowerCase());
      const mod = (r.module || '').toLowerCase();
      return tags.some(t => ['zakat', 'finance', 'money', 'business', 'trade', 'charity'].includes(t)) || mod.includes('almsgiving') || mod.includes('zakat');
    }
  }
];

const RITUAL_TYPES = ['All', 'Purification', 'Prayer', 'Fasting'];

export default function HomeTab({ rulings, loading }) {
  const [activeSit, setActiveSit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = useMemo(() => {
    let r = rulings;
    if (activeSit) r = r.filter(activeSit.filter);
    
    // Macro Filter (Ritual Types)
    if (activeFilter !== 'All') {
      const f = activeFilter.toLowerCase();
      r = r.filter(item => {
        const type = (item.ritual_type || '').toLowerCase();
        const mod = (item.module || '').toLowerCase();
        if (f === 'purification') return type.includes('wudu') || type.includes('ghusl') || mod.includes('purification');
        if (f === 'prayer') return type.includes('salah') || mod.includes('prayer');
        if (f === 'fasting') return type.includes('sawm') || mod.includes('fasting');
        return type.includes(f) || mod.includes(f);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter((x) => (x.title && x.title.toLowerCase().includes(q)) || (x.short_rule && x.short_rule.toLowerCase().includes(q)));
    }
    return r;
  }, [rulings, searchQuery, activeSit, activeFilter]);

  // Utility to group by ritual_phase
  const sections = useMemo(() => {
    const map = {};
    filtered.forEach(item => {
      const phase = item.ritual_phase || 'General Rulings';
      if (!map[phase]) map[phase] = [];
      map[phase].push(item);
    });
    return Object.keys(map).map(phase => ({
      title: phase,
      data: map[phase]
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [filtered]);

  const selectSit = useCallback((sit) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSit(sit);
  }, []);

  const clearFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveSit(null);
    setSearchQuery('');
    setActiveFilter('All');
  }, []);

  const isFinderView = !activeSit && searchQuery.trim() === '';

  // ── Render Components ──
  const renderFilterChips = () => (
    <View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {RITUAL_TYPES.map(f => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity 
              key={f} 
              onPress={() => setActiveFilter(f)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderFinder = () => (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>Assalamu Alaikum</Text>
          <Text style={styles.greetingSubtitle}>Let us find ease in your worship today.</Text>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
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

      <View style={styles.content}>
        <View style={styles.gridContainer}>
          <Text style={styles.gridLabel}>Common Life Situations</Text>
          <View style={styles.grid}>
            {SITUATIONS.map(sit => <SituationCard key={sit.id} situation={sit} onPress={selectSit} />)}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderResults = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={clearFilters} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={T.sage} />
          </TouchableOpacity>
          <View>
            <Text style={styles.resultsTitle}>{activeSit ? activeSit.title : 'Search Results'}</Text>
            <Text style={styles.resultsCount}>{filtered.length} rulings found</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchBarContainer, styles.searchBarContainerSmall]}>
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

      {renderFilterChips()}

      <View style={styles.content}>
        {loading ? (
          <View><SkeletonCard /><SkeletonCard /></View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RulingCard item={item} />}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState isFiltered={true} />}
          />
        )}
      </View>
    </View>
  );

  return isFinderView ? renderFinder() : renderResults();
};

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
  searchBarContainerSmall: { marginBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: T.border, ...T.shadow },
  searchInput: { flex: 1, fontSize: 15, color: T.ink },
  content: { flex: 1, paddingHorizontal: 24 },
  gridContainer: { flex: 1 },
  gridLabel: { fontSize: 12, fontWeight: '800', color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  scrollContent: { paddingBottom: 60 },
  
  // Chips
  chipScroll: { maxHeight: 50, marginBottom: 12 },
  chipContent: { paddingHorizontal: 24, gap: 10, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.inputBg, borderWidth: 1, borderColor: T.borderLight },
  chipActive: { backgroundColor: T.sage, borderColor: T.sage },
  chipText: { fontSize: 13, fontWeight: '700', color: T.inkMuted },
  chipTextActive: { color: '#FFF' },

  // Sections
  sectionHeader: { backgroundColor: T.pageBg, paddingTop: 32, paddingBottom: 12 },
  sectionHeaderText: { fontSize: 11, fontWeight: '900', color: T.sage, textTransform: 'uppercase', letterSpacing: 1.5 },
});
