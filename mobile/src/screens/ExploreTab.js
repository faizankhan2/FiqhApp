import { useState, useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { T, MADHHAB_FILTERS } from '../theme';
import { RulingCard } from '../components/RulingCard';
import { SkeletonCard, EmptyState } from '../components/SharedUI';

export default function ExploreTab({ rulings, loading }) {
  const [activeModule, setActiveModule] = useState('All');

  const modules = useMemo(() => {
    const list = rulings.map(r => r.module);
    return ['All', ...new Set(list)];
  }, [rulings]);

  const filtered = useMemo(() => {
    if (activeModule === 'All') return rulings;
    return rulings.filter(r => r.module === activeModule);
  }, [rulings, activeModule]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Traditional Books</Text>
        <Text style={styles.subtitle}>Browse the classical chapters of Fiqh</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {modules.map((name) => (
            <TouchableOpacity 
              key={name} 
              style={[styles.pill, activeModule === name && styles.pillActive]} 
              onPress={() => setActiveModule(name)}
            >
              <Text style={[styles.pillText, activeModule === name && styles.pillTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View><SkeletonCard /><SkeletonCard /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RulingCard item={item} />}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState isFiltered={activeModule !== 'All'} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: T.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: T.inkSoft, marginTop: 4, fontWeight: '500' },
  filterSection: { paddingLeft: 24, marginBottom: 8 },
  pillRow: { flexDirection: 'row', paddingVertical: 12, gap: 8, paddingRight: 24 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: T.rPill, backgroundColor: T.inputBg, borderWidth: 1, borderColor: T.border },
  pillActive: { backgroundColor: T.sage, borderColor: T.sage },
  pillText: { fontSize: 13, fontWeight: '700', color: T.inkSoft },
  pillTextActive: { color: T.inkWhite },
  content: { flex: 1, paddingHorizontal: 24 },
});
