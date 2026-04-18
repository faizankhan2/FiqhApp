import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T, CARD_WIDTH } from '../theme';

export function SituationCard({ situation, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.sitCard, { backgroundColor: situation.color }]}
      activeOpacity={0.8}
      onPress={() => onPress(situation)}
    >
      <View style={styles.sitIconBox}>
        <Feather name={situation.icon} size={22} color={T.inkSoft} />
      </View>
      <Text style={styles.sitTitle}>{situation.title}</Text>
      <Text style={styles.sitSubtitle}>{situation.subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sitCard: { width: CARD_WIDTH, height: 160, borderRadius: T.rCard, padding: 20, justifyContent: 'flex-end', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  sitIconBox: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 16, left: 16 },
  sitTitle: { fontSize: 17, fontWeight: '800', color: T.ink, marginBottom: 4, letterSpacing: -0.3 },
  sitSubtitle: { fontSize: 12, color: T.inkSoft, lineHeight: 16, fontWeight: '500' },
});
