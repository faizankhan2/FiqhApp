import { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { T, ICON_TABLE } from '../theme';

const ACTION_MAP = {
  fard: T.fard, wajib: T.fard, sunnah: T.sunnah, mustahab: T.sunnah, mandub: T.sunnah,
  mubah: T.neutral, makruh: T.makruh, haram: T.haram, mufsid: T.haram,
};

function getActionStyle(action) {
  if (!action) return { ...T.neutral, label: '—' };
  const key = action.toLowerCase().trim();
  const style = ACTION_MAP[key] || T.neutral;
  return { ...style, label: action };
}

const MADHHAB_COLORS = {
  hanafi:    { bg: '#E3EDF7', text: '#34608D' },
  maliki:    { bg: '#EDE3F3', text: '#6B3FA0' },
  shafii:    { bg: '#E0F2EB', text: '#1F7A54' },
  "shafi'i": { bg: '#E0F2EB', text: '#1F7A54' },
  hanbali:   { bg: '#F5EDE0', text: '#9A6B28' },
};

function getMadhhabStyle(name) {
  if (!name) return { bg: '#EDECE8', text: '#6B6B63' };
  return MADHHAB_COLORS[name.toLowerCase().trim()] || { bg: '#EDECE8', text: '#6B6B63' };
}

function getIconName(concept) {
  if (!concept) return 'book-open';
  const c = concept.toLowerCase().trim();
  if (ICON_TABLE[c]) return ICON_TABLE[c];
  for (const [k, v] of Object.entries(ICON_TABLE)) {
    if (c.includes(k)) return v;
  }
  return 'book-open';
}

export function RulingCard({ item, selectedMadhhab = 'All' }) {
  const [expanded, setExpanded] = useState(false);
  const actionStyle = getActionStyle(item.action);
  const iconName = getIconName(item.ui_icon_concept);
  const madhhabList = item.madhhab_applicability || [];
  const hasArabic = item.arabic_terminology && item.arabic_terminology.trim().length > 0;
  const hasDetails = item.details && item.details.trim().length > 0;
  const showMadhhabs = selectedMadhhab === 'All';
  
  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={toggle}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Feather name={iconName} size={20} color={T.sage} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.metaRow}>
            <View style={styles.breadcrumbContainer}>
              <Text style={styles.topicText} numberOfLines={1} ellipsizeMode="tail">
                {item.module}{item.topic ? ` › ${item.topic}` : ''}
              </Text>
            </View>
            {showMadhhabs && madhhabList.length > 0 && (
              <View style={styles.madhhabList}>
                {madhhabList.map((m, i) => (
                  <View key={i} style={[styles.madhhabPill, { backgroundColor: getMadhhabStyle(m).bg }]}>
                    <Text style={[styles.madhhabPillText, { color: getMadhhabStyle(m).text }]}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <View style={[styles.actionBadge, { backgroundColor: actionStyle.bg }]}>
            <Text style={[styles.actionBadgeText, { color: actionStyle.text }]}>{actionStyle.label}</Text>
          </View>
        </View>
      </View>

      {hasArabic && <Text style={styles.arabicText}>{item.arabic_terminology}</Text>}
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.shortRule}>{item.short_rule}</Text>

      <AnimatePresence>
        {!expanded && hasDetails && (
          <MotiView 
            from={{ opacity: 0, translateY: 5 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 5 }}
            style={styles.tapHint}
          >
            <Feather name="chevron-down" size={14} color={T.sage} />
            <Text style={styles.tapHintText}>Tap for steps & wisdom</Text>
          </MotiView>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <MotiView 
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            style={styles.expandedWrapper}
          >
            <View style={styles.expandedArea}>
              <Text style={styles.sectionLabel}>The Detail</Text>
              <Text style={styles.detailsText}>{item.details}</Text>

              {(item.actionable_steps || []).length > 0 && (
                <View style={styles.stepSection}>
                  <Text style={styles.sectionLabel}>The How-To</Text>
                  {item.actionable_steps.map((s, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepCircle}><Text style={styles.stepNum}>{i + 1}</Text></View>
                      <Text style={styles.stepText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {item.spiritual_wisdom && (
                <View style={styles.wisdomBox}>
                  <View style={styles.wisdomHeader}>
                    <Feather name="heart" size={14} color={T.sage} />
                    <Text style={styles.wisdomTitle}>The Heart</Text>
                  </View>
                  <Text style={styles.wisdomText}>{item.spiritual_wisdom}</Text>
                </View>
              )}

              <View style={styles.proofSection}>
                <Text style={styles.sectionLabel}>The Proof</Text>
                {item.quran_hadith_evidence && (
                  <Text style={styles.evidenceText}>“{item.quran_hadith_evidence}”</Text>
                )}
                <View style={styles.sourceTag}>
                  <Feather name="book" size={12} color={T.inkMuted} style={{ marginTop: 2 }} />
                  <View style={{ flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Text style={styles.sourceLabel}>Source: </Text>
                    <Text style={styles.sourceValue}>{item.source_book || 'Classical Text'}{item.volume_page ? `, pg. ${item.volume_page}` : ''}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.tapHint}>
                <Feather name="chevron-up" size={14} color={T.sage} />
                <Text style={styles.tapHintText}>Tap to collapse</Text>
              </View>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: T.cardBg, borderRadius: T.r, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: T.border, ...T.shadow },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: T.sageBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  headerContent: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  breadcrumbContainer: { flex: 1, marginRight: 8 },
  madhhabList: { flexDirection: 'row', gap: 4 },
  madhhabPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  madhhabPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  topicText: { fontSize: 11, color: T.inkMuted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  actionBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, marginBottom: 8 },
  actionBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  arabicText: { fontSize: 28, color: '#8B7E6A', textAlign: 'right', marginBottom: 12, lineHeight: 42 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: T.ink, marginBottom: 8, letterSpacing: -0.4 },
  shortRule: { fontSize: 15, fontWeight: '400', color: '#4A5568', lineHeight: 22, marginBottom: 8 },
  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 6 },
  tapHintText: { fontSize: 12, color: T.sage, fontWeight: '800', letterSpacing: 0.5 },
  expandedWrapper: { overflow: 'hidden' },
  expandedArea: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: T.borderLight },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginTop: 18 },
  detailsText: { fontSize: 15, color: T.inkSoft, lineHeight: 26 },
  stepSection: { marginTop: 8 },
  stepRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.sage, alignItems: 'center', justifyContent: 'center', marginRight: 14, marginTop: 2 },
  stepNum: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  stepText: { flex: 1, fontSize: 15, color: T.inkSoft, lineHeight: 26 },
  wisdomBox: { backgroundColor: T.pastelGreen, borderRadius: 16, padding: 18, marginTop: 24, borderWidth: 1, borderColor: 'rgba(126, 168, 126, 0.15)' },
  wisdomHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  wisdomTitle: { fontSize: 12, fontWeight: '900', color: T.sage, textTransform: 'uppercase', letterSpacing: 1.2 },
  wisdomText: { fontSize: 15, color: T.inkSoft, lineHeight: 24, fontStyle: 'italic', fontWeight: '500' },
  proofSection: { marginTop: 24, paddingBottom: 10 },
  evidenceText: { fontSize: 16, color: T.ink, lineHeight: 26, fontStyle: 'italic', marginBottom: 20, paddingLeft: 14, borderLeftWidth: 4, borderLeftColor: T.sageBg, fontWeight: '500' },
  sourceTag: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: T.inputBg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, maxWidth: '100%' },
  sourceLabel: { fontSize: 11, fontWeight: '900', color: T.inkMuted, textTransform: 'uppercase' },
  sourceValue: { fontSize: 13, color: T.inkSoft, fontWeight: '700' },
});
