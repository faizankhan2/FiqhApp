import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T, MADHHAB_FILTERS } from '../theme';

export default function SettingsTab({ selectedMadhhab, setSelectedMadhhab }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure your Fiqh experience</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>School of Thought (Madhhab)</Text>
          <Text style={styles.sectionDesc}>Select your preferred legal school for rulings.</Text>
          
          <View style={styles.madhhabList}>
            {MADHHAB_FILTERS.map((m) => (
              <TouchableOpacity 
                key={m} 
                style={[styles.madhhabItem, selectedMadhhab === m && styles.madhhabItemActive]}
                onPress={() => setSelectedMadhhab(m)}
              >
                <View>
                  <Text style={[styles.madhhabName, selectedMadhhab === m && styles.madhhabNameActive]}>{m}</Text>
                  {m === 'All' && <Text style={styles.madhhabSub}>Show rulings from all schools</Text>}
                </View>
                {selectedMadhhab === m && <Feather name="check-circle" size={18} color={T.sage} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App Version</Text>
          <Text style={styles.versionText}>v1.0.0 (Peaceful Scholar Edition)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: T.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: T.inkSoft, marginTop: 4, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24 },
  section: { marginTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: T.borderLight },
  sectionLabel: { fontSize: 12, fontWeight: '900', color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: T.inkSoft, marginBottom: 16 },
  madhhabList: { gap: 10 },
  madhhabItem: { padding: 16, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: T.border, ...T.shadow, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  madhhabItemActive: { borderColor: T.sage, backgroundColor: T.sageBg },
  madhhabName: { fontSize: 16, fontWeight: '700', color: T.ink },
  madhhabNameActive: { color: T.sage },
  madhhabSub: { fontSize: 11, color: T.inkMuted, marginTop: 2 },
  versionText: { fontSize: 13, color: T.inkMuted, marginTop: 8 },
});
