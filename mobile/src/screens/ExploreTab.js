import { useState, useMemo, useCallback } from 'react';
import { SectionList, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T } from '../theme';
import { RulingCard } from '../components/RulingCard';
import { SkeletonCard, EmptyState } from '../components/SharedUI';

const getIconForModule = (mod) => {
  const m = mod.toLowerCase();
  if (m.includes('purification') || m.includes('tahara')) return 'droplet';
  if (m.includes('prayer') || m.includes('salah')) return 'sun';
  if (m.includes('fasting') || m.includes('sawm')) return 'moon';
  if (m.includes('zakat') || m.includes('charity')) return 'heart';
  if (m.includes('hajj') || m.includes('ziyara')) return 'navigation';
  return 'book-open';
};

export default function ExploreTab({ rulings, loading, selectedMadhhab = 'All' }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // ── Level 1: Modules ──
  const modules = useMemo(() => {
    const list = rulings.map(r => r.module);
    return [...new Set(list)].sort();
  }, [rulings]);

  // ── Level 2: Topics ──
  const topics = useMemo(() => {
    if (!selectedModule) return [];
    const list = rulings
      .filter(r => r.module === selectedModule)
      .map(r => r.topic || 'General');
    return [...new Set(list)].sort();
  }, [rulings, selectedModule]);

  // ── Level 3 Data Preparation ──
  const chapterData = useMemo(() => {
    if (!selectedModule || !selectedTopic) return null;
    
    const masterFiltered = rulings.filter(r => 
      r.module === selectedModule && 
      (r.topic === selectedTopic || (!r.topic && selectedTopic === 'General'))
    );

    // Filter by Madhhab
    const filtered = masterFiltered.filter(r => 
      selectedMadhhab === 'All' || 
      (r.madhhab_applicability || []).includes(selectedMadhhab) || 
      (r.madhhab_applicability || []).includes('All')
    );

    const prep = filtered.filter(r => ['Foundations', 'Requirements'].some(p => (r.ritual_phase || '').includes(p)));
    const method = filtered.filter(r => ['Execution'].some(p => (r.ritual_phase || '').includes(p)));
    
    // Extract unique evidence with attribution
    const evidenceMap = new Map();
    filtered.forEach(r => {
      const q = r.quran_hadith_evidence;
      if (q && !evidenceMap.has(q)) {
        evidenceMap.set(q, {
          quote: q,
          book: r.source_book,
          author: r.author,
          page: r.volume_page
        });
      }
    });
    const evidence = Array.from(evidenceMap.values());
    const steps = method.flatMap(r => (r.actionable_steps || []).map(s => ({
      text: s,
      isObligatory: ['Obligatory', 'Pillar', 'Condition'].includes(r.action_classification)
    })));
    
    const brief = filtered[0]?.topic_brief;
    
    // Extract unique source references
    const sources = [];
    const seenSources = new Set();
    filtered.forEach(r => {
      if (!r.source_book) return;
      const key = `${r.source_book}|${r.author}|${r.volume_page}`;
      if (!seenSources.has(key)) {
        sources.push({ book: r.source_book, author: r.author, page: r.volume_page });
        seenSources.add(key);
      }
    });

    const invalidators = filtered.filter(r => (r.ritual_phase || '').includes('Boundaries'));
    const remedies = filtered.filter(r => (r.ritual_phase || '').includes('Concessions'));
    const etiquettes = filtered.filter(r => (r.ritual_phase || '').includes('Excellence'));

    return { prep, method, evidence, steps, sources, brief, invalidators, remedies, etiquettes };
  }, [rulings, selectedModule, selectedTopic]);

  // ── Navigation Logic ──
  const goBack = useCallback(() => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else if (selectedModule) {
      setSelectedModule(null);
    }
  }, [selectedModule, selectedTopic]);

  // ── Render Level 1: Books ──
  const renderModules = () => (
    <FlatList
      data={modules}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.moduleRow} onPress={() => setSelectedModule(item)}>
          <View style={styles.moduleIconBox}>
            <Feather name={getIconForModule(item)} size={20} color={T.sage} />
          </View>
          <Text style={styles.moduleName}>{item}</Text>
          <Feather name="chevron-right" size={20} color={T.inkMuted} />
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listPadding}
    />
  );

  // ── Render Level 2: Chapters ──
  const renderTopics = () => (
    <FlatList
      data={topics}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.topicRow} onPress={() => setSelectedTopic(item)}>
          <View style={styles.topicIndicator} />
          <Text style={styles.topicName}>{item}</Text>
          <Feather name="chevron-right" size={18} color={T.inkMuted} />
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listPadding}
    />
  );

  // ── Render Level 3: Chapter Guide (The Article) ──
  const renderChecklistSection = (title, data, introText = null) => {
    if (!data || data.length === 0) return null;
    const firstWisdom = data.find(r => r.spiritual_wisdom)?.spiritual_wisdom;

    return (
      <View style={styles.articleSection}>
        <Text style={styles.articleSectionTitle}>{title}</Text>
        {introText && <Text style={styles.sectionIntro}>{introText}</Text>}
        <View style={styles.checklist}>
          {data.map((r, i) => (
            <View key={i} style={styles.checklistItem}>
              <Text style={styles.checklistBullet}>•</Text>
              <Text style={styles.checklistText}>
                <Text style={styles.checklistBold}>{r.title}</Text>: {r.short_rule}
              </Text>
              {/* Nested Sub-bullets */}
              {(r.actionable_steps || []).length > 0 && (
                <View style={styles.subList}>
                  {r.actionable_steps.map((step, si) => (
                    <View key={si} style={styles.subItem}>
                      <Text style={styles.subBulletIndicator}>◦</Text>
                      <Text style={styles.subText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
        {firstWisdom && (
          <View style={styles.articleWisdom}>
            <Text style={styles.articleWisdomText}>{firstWisdom}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderChapterGuide = () => {
    const { prep, evidence, steps } = chapterData;
    const showMadhhabs = selectedMadhhab === 'All';

    return (
      <ScrollView style={styles.articleScroll} contentContainerStyle={styles.articleContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.articleHeader}>
          <Text style={styles.articleTopicLabel}>{selectedModule}</Text>
          <Text style={styles.articleTitle}>{selectedTopic}</Text>
          {chapterData.brief && (
            <Text style={styles.articleBrief}>{chapterData.brief}</Text>
          )}
          <View style={styles.articleDivider} />
        </View>

        {/* Section 1: Conditions & Preparation */}
        {renderChecklistSection('Before You Begin', chapterData.prep)}

        {/* Section 2: THE METHOD */}
        {steps.length > 0 && (
          <View style={styles.articleSection}>
            <Text style={styles.articleSectionTitle}>The Method</Text>
            <Text style={styles.methodLegend}>Dark numbers indicate obligatory steps. Light numbers indicate recommended steps.</Text>
            <View style={styles.methodList}>
              {steps.map((step, i) => (
                <View key={'step-' + i} style={styles.methodRow}>
                  <Text style={[
                    styles.methodNum,
                    step.isObligatory ? styles.methodNumObligatory : styles.methodNumRecommended
                  ]}>{i + 1}.</Text>
                  <Text style={styles.methodText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Auxiliary Sections transformed to Checklists */}
        {renderChecklistSection('What Breaks It', chapterData.invalidators, 'The following actions gently lift your state of purity, requiring you to perform ablution again:')}
        {renderChecklistSection('Mending Mistakes', chapterData.remedies)}
        {renderChecklistSection('Beautiful Habits', chapterData.etiquettes)}

        {/* Section 3: Divine Evidence */}
        {evidence.length > 0 && (
          <View style={styles.articleSection}>
            <Text style={styles.articleSectionTitle}>Divine Evidence</Text>
            {evidence.map((ev, i) => (
              <View key={'ev-' + i} style={styles.evidenceQuote}>
                <Feather name="quote" size={20} color={T.sage} style={{ opacity: 0.2, marginBottom: 8 }} />
                <Text style={styles.evidenceQuoteText}>{ev.quote}</Text>
                <Text style={styles.evidenceAttribution}>
                  — Cited in {ev.book} by {ev.author || 'Unknown'}{ev.page ? `, ${ev.page}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Section 4: References */}
        {chapterData.sources.length > 0 && (
          <View style={styles.articleSection}>
            <Text style={styles.articleSectionTitle}>References</Text>
            <View style={styles.referenceList}>
              {chapterData.sources.map((src, i) => (
                <Text key={'src-' + i} style={styles.referenceText}>
                  Source: <Text style={styles.referenceBold}>{src.book}</Text> by {src.author || 'Unknown'}{src.page ? `, pg. ${src.page}` : ''}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View style={styles.articleFooter}>
          <Text style={styles.footerText}>May this knowledge bring ease to your practice.</Text>
        </View>
      </ScrollView>
    );
  };

  const getBreadcrumb = () => {
    if (selectedTopic) return `${selectedModule} › ${selectedTopic}`;
    if (selectedModule) return selectedModule;
    return 'Classical Libraries';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {(selectedModule || selectedTopic) && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={T.sage} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>{selectedTopic ? 'Chapter Guide' : selectedModule ? 'Select Topic' : 'The Books'}</Text>
            <Text style={styles.subtitle}>{getBreadcrumb()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View><SkeletonCard /><SkeletonCard /></View>
        ) : !selectedModule ? (
          renderModules()
        ) : !selectedTopic ? (
          renderTopics()
        ) : (
          renderChapterGuide()
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.pageBg },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 16, ...T.shadow },
  title: { fontSize: 24, fontWeight: '800', color: T.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: T.inkMuted, marginTop: 2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  content: { flex: 1 },
  listPadding: { paddingHorizontal: 24, paddingBottom: 40 },
  
  // Level 1 Modules
  moduleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: T.border, ...T.shadow },
  moduleIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.sageBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  moduleName: { flex: 1, fontSize: 17, fontWeight: '700', color: T.ink },

  // Level 2 Topics
  topicRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: T.borderLight },
  topicIndicator: { width: 4, height: 20, borderRadius: 2, backgroundColor: T.sage, marginRight: 16 },
  topicName: { flex: 1, fontSize: 16, fontWeight: '600', color: T.ink },

  // Level 3 Chapter Guide (Article View)
  articleScroll: { flex: 1 },
  articleContent: { paddingHorizontal: 32, paddingBottom: 60 },
  articleHeader: { marginBottom: 32 },
  articleTopicLabel: { fontSize: 12, fontWeight: '900', color: T.sage, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  articleTitle: { fontSize: 32, fontWeight: '800', color: T.ink, letterSpacing: -1 },
  articleBrief: { fontSize: 18, color: T.inkSoft, lineHeight: 30, marginTop: 12, fontWeight: '500' },
  articleDivider: { width: 60, height: 4, backgroundColor: T.sage, marginTop: 24, borderRadius: 2 },
  
  articleSection: { marginBottom: 40 },
  articleSectionTitle: { fontSize: 13, fontWeight: '900', color: T.inkMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 },
  
  articleBlock: { marginBottom: 32 },
  articleBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  articleBlockTitle: { fontSize: 19, fontWeight: '800', color: T.ink, flex: 1, marginRight: 12 },
  articleMadhhabRow: { flexDirection: 'row', gap: 4 },
  miniMadhhab: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: T.inputBg, borderRadius: 4 },
  miniMadhhabText: { fontSize: 9, fontWeight: '800', color: T.inkSoft, textTransform: 'uppercase' },

  articleText: { fontSize: 17, color: T.inkSoft, lineHeight: 28, fontWeight: '400' },
  articleWisdom: { marginTop: 16, paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: T.sageBg },
  articleWisdomText: { fontSize: 15, color: T.sage, fontStyle: 'italic', fontWeight: '500', lineHeight: 24 },

  methodList: { gap: 20 },
  methodLegend: { fontSize: 12, color: T.inkMuted, fontStyle: 'italic', marginBottom: 20, marginTop: -8 },
  methodRow: { flexDirection: 'row', alignItems: 'flex-start' },
  methodNum: { fontSize: 17, marginRight: 12, width: 28 },
  methodNumObligatory: { fontWeight: '900', color: T.ink },
  methodNumRecommended: { fontWeight: '400', color: T.sageLight },
  methodText: { flex: 1, fontSize: 17, color: T.inkSoft, lineHeight: 28 },

  evidenceQuote: { backgroundColor: T.cardAccent, padding: 24, borderRadius: 20, marginBottom: 16 },
  evidenceQuoteText: { fontSize: 16, color: T.ink, lineHeight: 26, fontStyle: 'italic', fontWeight: '500' },
  evidenceAttribution: { fontSize: 12, color: T.inkMuted, fontStyle: 'italic', marginTop: 12, fontWeight: '600' },

  articleFooter: { marginTop: 40, alignItems: 'center', paddingTop: 40, borderTopWidth: 1, borderTopColor: T.borderLight },
  footerText: { fontSize: 14, color: T.inkMuted, fontStyle: 'italic' },

  // References Section
  referenceList: { gap: 10 },
  referenceText: { fontSize: 13, color: T.inkSoft, fontStyle: 'italic', lineHeight: 20 },
  referenceBold: { fontWeight: '700', color: T.ink },
  
  sectionIntro: { fontSize: 14, color: T.inkMuted, fontStyle: 'italic', marginBottom: 16, lineHeight: 22 },

  // Checklist Styles
  checklist: { gap: 8, marginBottom: 16 },
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start' },
  checklistBullet: { fontSize: 18, color: T.sage, marginRight: 8, marginTop: -2 },
  checklistText: { flex: 1, fontSize: 16, color: T.inkSoft, lineHeight: 24 },
  checklistBold: { fontWeight: '700', color: T.ink },

  // Sub-bullet Styles
  subList: { marginTop: 8, paddingLeft: 4, gap: 6 },
  subItem: { flexDirection: 'row', alignItems: 'flex-start' },
  subBulletIndicator: { fontSize: 14, color: T.sage, marginRight: 8, marginTop: 1 },
  subText: { flex: 1, fontSize: 14, color: T.inkMuted, lineHeight: 20 },
});
