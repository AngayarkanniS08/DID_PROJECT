import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { historyService, ScanRecord } from '../services/History.service';

export const HistoryScreen = ({ navigation }: any) => {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await historyService.getHistory();
    setHistory(data);
  };

  const renderItem = ({ item }: { item: ScanRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={[styles.status, item.status === 'success' ? styles.statusSuccess : styles.statusFailed]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.subtext}>Roll: {item.rollNumber}</Text>
      <Text style={styles.time}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan History</Text>
        <TouchableOpacity onPress={async () => { await historyService.clearHistory(); loadHistory(); }}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No scans yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E'
  },
  title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  backBtn: { color: '#F97316', fontSize: 16 },
  clearBtn: { color: '#F87171', fontSize: 16 },
  list: { padding: 20 },
  card: { 
    backgroundColor: '#1E1E1E', 
    borderRadius: 15, 
    padding: 16, 
    marginBottom: 12 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  status: { fontSize: 12, fontWeight: '700' },
  statusSuccess: { color: '#22C55E' },
  statusFailed: { color: '#EF4444' },
  subtext: { color: '#A0A0A0', fontSize: 14 },
  time: { color: '#666', fontSize: 12, marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#666', fontSize: 16 },
});
