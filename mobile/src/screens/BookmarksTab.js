import { StyleSheet, Text, View } from 'react-native';
import { T } from '../theme';
import { EmptyState } from '../components/SharedUI';

export default function BookmarksTab() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookmarks</Text>
        <Text style={styles.subtitle}>Quick access to your important rulings</Text>
      </View>
      <View style={styles.content}>
        <EmptyState 
          isFiltered={false} 
          title="No bookmarks yet"
          message="Your saved rulings will appear here for quick reference."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: T.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: T.inkSoft, marginTop: 4, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
});
