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
  sitCard: { 
    width: CARD_WIDTH, 
    aspectRatio: 1, 
    borderRadius: T.rCard, 
    padding: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.05)' 
  },
  sitIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.6)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12 
  },
  sitTitle: { fontSize: 16, fontWeight: '800', color: T.ink, marginBottom: 4, letterSpacing: -0.3, textAlign: 'center' },
  sitSubtitle: { fontSize: 11, color: T.inkSoft, lineHeight: 14, fontWeight: '500', textAlign: 'center' },
});
