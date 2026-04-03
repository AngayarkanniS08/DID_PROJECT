import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { merkleCacheService } from '../services/MerkleCache.service';

type CacheStatus = { hasCache: boolean; syncedAgo: string; isStale: boolean; leafCount: number } | null;

export const HomeScreen = ({ navigation }: any) => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>(null);

  useEffect(() => {
    // 1. Try to sync from backend (silent, non-blocking)
    merkleCacheService.syncFromBackend().then(() => loadCacheStatus());
    // 2. Also load current cache state immediately
    loadCacheStatus();
  }, []);

  const loadCacheStatus = async () => {
    const status = await merkleCacheService.getCacheStatus();
    setCacheStatus(status);
  };

  const statusDot = !cacheStatus?.hasCache
    ? { color: '#EF4444', label: 'No registry cache' }
    : cacheStatus.isStale
    ? { color: '#F97316', label: `Stale — ${cacheStatus.syncedAgo}` }
    : { color: '#22C55E', label: `Registry synced ${cacheStatus.syncedAgo}` };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mobile Verifier</Text>
          <Text style={styles.subtitle}>Secure Identity Verification</Text>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.statusCircle}>
            <Text style={{ fontSize: 40 }}>🛡️</Text>
          </View>
          <Text style={styles.heroText}>Ready to Verify</Text>

          {/* Merkle cache status badge */}
          {cacheStatus !== null && (
            <View style={styles.cacheBadge}>
              <View style={[styles.dot, { backgroundColor: statusDot.color }]} />
              <Text style={[styles.cacheLabel, { color: statusDot.color }]}>
                {statusDot.label}
                {cacheStatus.leafCount > 0 && ` · ${cacheStatus.leafCount} students`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scanner')}
            activeOpacity={0.8}
          >
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.8}
          >
            <Text style={styles.historyButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    marginTop: 4,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderWidth: 2,
    borderColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 10,
  },
  heroText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionSection: {
    marginBottom: 40,
  },
  scanButton: {
    backgroundColor: '#FB923C',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  scanButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  historyButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    marginTop: 16,
  },
  historyButtonText: {
    color: '#A0A0A0',
    fontSize: 18,
    fontWeight: '600',
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cacheLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

