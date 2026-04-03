import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keccak256 for React Native ────────────────────────────
// We use ethers.js (already installed) instead of the Node.js keccak256 package
// which has native deps incompatible with Hermes/Expo
import { ethers } from 'ethers';

// ─── Storage Keys ──────────────────────────────────────────
const KEYS = {
  ROOT: 'merkle:root',
  CONTRACT_ADDRESS: 'merkle:contractAddress',
  CHAIN_ID: 'merkle:chainId',
  LAST_SYNC: 'merkle:lastSync',
  LEAF_COUNT: 'merkle:leafCount',
};

// ─── Config ────────────────────────────────────────────────
// Update this to your NestJS API URL
const API_URL = 'http://192.168.1.5:3000'; // dev: local IP
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ─── Types ─────────────────────────────────────────────────
export interface MerkleSyncPayload {
  root: string;
  contractAddress: string;
  chainId: number;
  lastUpdated: number;
  leafCount: number;
  proofDepth: number;
  syncedAt: string;
}

export interface MerkleVerifyResult {
  verified: boolean;
  cacheAge: number; // ms since last sync
  isStale: boolean; // true if cache > 6 hours old
  hasCache: boolean;
}

function keccak256Hex(input: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.replace('0x', '');
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return arr;
}

function concatAndHash(a: string, b: string): string {
  // Sort pairs for determinism (matches sortPairs: true in tree builder)
  const aClean = a.replace('0x', '').toLowerCase();
  const bClean = b.replace('0x', '').toLowerCase();
  const [left, right] = aClean < bClean ? [aClean, bClean] : [bClean, aClean];
  const combined = '0x' + left + right;
  return ethers.keccak256(combined);
}

// ─── MerkleCacheService ────────────────────────────────────

class MerkleCacheService {
  /**
   * Sync the Merkle Root from the NestJS backend.
   * Called on app launch (if online) and every 6 hours.
   * Safe to call multiple times — idempotent.
   */
  async syncFromBackend(token?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/merkle/sync`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) return false;

      const payload: MerkleSyncPayload = await response.json();

      await AsyncStorage.multiSet([
        [KEYS.ROOT, payload.root],
        [KEYS.CONTRACT_ADDRESS, payload.contractAddress],
        [KEYS.CHAIN_ID, String(payload.chainId)],
        [KEYS.LAST_SYNC, String(Date.now())],
        [KEYS.LEAF_COUNT, String(payload.leafCount)],
      ]);

      console.log(`[MerkleCache] Synced root: ${payload.root.slice(0, 10)}... (${payload.leafCount} students)`);
      return true;
    } catch (err) {
      console.warn('[MerkleCache] Sync failed (offline?):', err);
      return false;
    }
  }

  /**
   * Get the cached Merkle Root from AsyncStorage.
   */
  async getCachedRoot(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ROOT);
  }

  /**
   * Get time (ms) since last cache sync.
   */
  async getSyncAge(): Promise<number> {
    const lastSync = await AsyncStorage.getItem(KEYS.LAST_SYNC);
    if (!lastSync) return Infinity;
    return Date.now() - parseInt(lastSync, 10);
  }

  /**
   * Check if cache should be refreshed (> 6 hours old).
   */
  async isCacheStale(): Promise<boolean> {
    const age = await this.getSyncAge();
    return age > SYNC_INTERVAL_MS;
  }

  /**
   * Verify a student's Merkle proof against the cached root.
   * Runs COMPLETELY OFFLINE — pure cryptographic math.
   *
   * @param did     The student's DID (from QR: credentialSubject.id)
   * @param proof   The Merkle proof array (from QR: merkleProof)
   * @returns MerkleVerifyResult with verified status + cache metadata
   */
  async verifyProof(did: string, proof: string[]): Promise<MerkleVerifyResult> {
    const root = await this.getCachedRoot();
    const cacheAge = await this.getSyncAge();
    const isStale = cacheAge > SYNC_INTERVAL_MS;

    const hasCache = !!root && root !== '0x';

    if (!hasCache || !proof || proof.length === 0) {
      return { verified: false, cacheAge, isStale, hasCache };
    }

    // Walk the Merkle proof path
    let computed = keccak256Hex(did); // leaf = keccak256(did)
    for (const sibling of proof) {
      computed = concatAndHash(computed, sibling);
    }

    const verified = computed.toLowerCase() === root.toLowerCase();
    return { verified, cacheAge, isStale, hasCache };
  }

  /**
   * Get cache status summary for UI display.
   */
  async getCacheStatus(): Promise<{
    hasCache: boolean;
    syncedAgo: string;
    isStale: boolean;
    leafCount: number;
  }> {
    const [root, lastSyncStr, leafCountStr] = await AsyncStorage.multiGet([
      KEYS.ROOT,
      KEYS.LAST_SYNC,
      KEYS.LEAF_COUNT,
    ]).then(pairs => pairs.map(p => p[1]));

    const hasCache = !!root && root !== '0x';
    const leafCount = parseInt(leafCountStr || '0', 10);

    if (!lastSyncStr) {
      return { hasCache: false, syncedAgo: 'Never synced', isStale: true, leafCount: 0 };
    }

    const ageMs = Date.now() - parseInt(lastSyncStr, 10);
    const ageMin = Math.floor(ageMs / 60000);
    const ageHr  = Math.floor(ageMs / 3600000);

    let syncedAgo: string;
    if (ageMin < 1)      syncedAgo = 'Just now';
    else if (ageMin < 60) syncedAgo = `${ageMin}m ago`;
    else                  syncedAgo = `${ageHr}h ago`;

    return {
      hasCache,
      syncedAgo,
      isStale: ageMs > SYNC_INTERVAL_MS,
      leafCount,
    };
  }

  /**
   * Clear the cache (useful for testing / logout).
   */
  async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }
}

// Singleton export
export const merkleCacheService = new MerkleCacheService();
