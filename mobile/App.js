import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { supabase } from './src/lib/supabase';
import { T } from './src/theme';

// Import Screens
import HomeTab from './src/screens/HomeTab';
import ExploreTab from './src/screens/ExploreTab';
import BookmarksTab from './src/screens/BookmarksTab';
import SettingsTab from './src/screens/SettingsTab';

// ── Tab Constants ──
const TABS = [
  { id: 'Home', icon: 'home', label: 'Home' },
  { id: 'Explore', icon: 'book-open', label: 'Explore' },
  { id: 'Bookmarks', icon: 'bookmark', label: 'Saved' },
  { id: 'Settings', icon: 'settings', label: 'Settings' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedMadhhab, setSelectedMadhhab] = useState('All');
  const [rulings, setRulings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Global Data Fetching (Madhhab Aware) ──
  const fetchRulings = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('fiqh_rulings').select('*');
      
      if (selectedMadhhab !== 'All') {
        // Filter rulings where madhhab_applicability contains the selected school
        query = query.contains('madhhab_applicability', [selectedMadhhab]);
      }
      
      const { data, error } = await query.order('module', { ascending: true });
      if (error) throw error;
      setRulings(data || []);
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMadhhab]);

  useEffect(() => {
    fetchRulings();
  }, [fetchRulings]);

  // ── Render Switcher ──
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeTab rulings={rulings} loading={loading} />;
      case 'Explore':
        return <ExploreTab rulings={rulings} loading={loading} />;
      case 'Bookmarks':
        return <BookmarksTab />;
      case 'Settings':
        return <SettingsTab selectedMadhhab={selectedMadhhab} setSelectedMadhhab={setSelectedMadhhab} />;
      default:
        return <HomeTab rulings={rulings} loading={loading} />;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar style="dark" />
        
        {/* ── Main Viewport ── */}
        <View style={styles.main}>
          {renderContent()}
        </View>

        {/* ── Custom Tab Bar ── */}
        <SafeAreaView style={styles.tabBarEdge}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Feather 
                    name={tab.icon} 
                    size={22} 
                    color={isActive ? T.sage : T.inkMuted} 
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.pageBg },
  main: { flex: 1 },
  
  tabBarEdge: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: T.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 8 },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: T.inkMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: T.sage,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.sage,
    position: 'absolute',
    bottom: -8,
  },
});
