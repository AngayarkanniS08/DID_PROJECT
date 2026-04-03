import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Verifier, DIDGenerator } from '@secure-verify/did-core';
import { historyService } from '../services/History.service';
import { merkleCacheService } from '../services/MerkleCache.service';

// ─── Theme constants ───────────────────────────────────────
const THEME = {
  pass:    { bg: '#041A0A', accent: '#22C55E', label: 'AUTHENTIC IDENTITY', icon: '✅' },
  fail:    { bg: '#1A0404', accent: '#EF4444', label: 'VERIFICATION FAILED', icon: '❌' },
  expired: { bg: '#1A120A', accent: '#F97316', label: 'CREDENTIAL EXPIRED',  icon: '⏳' },
  loading: { bg: '#0A0A0A', accent: '#FB923C', label: 'Verifying...',         icon: '🔍' },
};

type ResultState = 'loading' | 'pass' | 'fail' | 'expired';

export const ResultScreen = ({ route, navigation }: any) => {
  const { rawScannedData } = route.params || {};

  const [resultState, setResultState] = useState<ResultState>('loading');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [cryptoInfo, setCryptoInfo]   = useState<any>(null);
  const [errorMsg, setErrorMsg]       = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  // Auto-reset countdown (3 → 0 → navigate to Scanner)
  const [countdown, setCountdown]     = useState(3);
  const [autoResetActive, setAutoResetActive] = useState(false);
  const [merkleStale, setMerkleStale]           = useState(false); // amber warning
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Verification ────────────────────────────────────────
  useEffect(() => {
    if (rawScannedData) performVerification(rawScannedData);
  }, [rawScannedData]);

  const performVerification = async (data: string) => {
    try {
      const credential = JSON.parse(data);

      // 1. Expiry check
      if (credential.expirationDate) {
        const expiry = new Date(credential.expirationDate);
        if (expiry < new Date()) {
          setResultState('expired');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setStudentInfo(credential.credentialSubject || null);
          setAutoResetActive(true);
          await historyService.saveScan({
            name: credential.credentialSubject?.name || 'Unknown',
            rollNumber: credential.credentialSubject?.rollNumber || 'N/A',
            status: 'failed',
            recoveredAddress: '',
            issuerAddress: '',
          });
          return;
        }
      }

      // 2. Signature check
      const issuerDID = credential.issuer || credential.iss;
      if (!issuerDID) throw new Error('Invalid credential: No issuer DID found');
      const issuerAddress = DIDGenerator.extractAddress(issuerDID);
      const result = Verifier.verifyIdentity(credential, issuerAddress);

      // 3. Merkle proof check (offline enrollment verification)
      if (credential.merkleProof && credential.credentialSubject?.id) {
        const merkleResult = await merkleCacheService.verifyProof(
          credential.credentialSubject.id,
          credential.merkleProof,
        );

        if (!merkleResult.hasCache) {
          // No cache yet — warn but don't block (signature is still verified)
          setErrorMsg('No registry cache. Connect to sync.');
        } else if (!merkleResult.verified) {
          // Student NOT in the enrolled registry — hard fail
          setResultState('fail');
          setStudentInfo(credential.credentialSubject || null);
          setErrorMsg('Student not in enrolled registry (Merkle mismatch)');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await historyService.saveScan({
            name: credential.credentialSubject?.name || 'Unknown',
            rollNumber: credential.credentialSubject?.rollNumber || 'N/A',
            status: 'failed',
            recoveredAddress: '',
            issuerAddress,
          });
          setAutoResetActive(true);
          return;
        } else if (merkleResult.isStale) {
          // Cache is old — pass but show amber warning
          setMerkleStale(true);
        }
      }

      const state: ResultState = result.isValid ? 'pass' : 'fail';
      setResultState(state);
      setStudentInfo(credential.credentialSubject || null);
      setCryptoInfo({ recoveredAddress: result.recoveredAddress, issuerAddress });
      setErrorMsg(result.error || '');

      // Haptic
      if (result.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      await historyService.saveScan({
        name: credential.credentialSubject?.name || 'Unknown',
        rollNumber: credential.credentialSubject?.rollNumber || 'N/A',
        status: result.isValid ? 'success' : 'failed',
        recoveredAddress: result.recoveredAddress,
        issuerAddress,
      });

      setAutoResetActive(true);

    } catch (err: any) {
      setResultState('fail');
      setErrorMsg(`Parse Error: ${err.message}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAutoResetActive(true);
    }
  };

  // Auto-reset timer — two effects: one counts down, one fires navigation
  useEffect(() => {
    if (!autoResetActive) return;
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        const next = c - 1;
        if (next <= 0) clearInterval(countdownRef.current!);
        return Math.max(0, next);
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [autoResetActive]);

  // Navigate only when countdown reaches 0 (never inside a state updater)
  useEffect(() => {
    if (countdown === 0 && autoResetActive) {
      navigation.navigate('Scanner');
    }
  }, [countdown]);

  const cancelAutoReset = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setAutoResetActive(false);
  };

  // ─── Render ───────────────────────────────────────────────
  const theme = THEME[resultState];

  return (
    <TouchableWithoutFeedback onPress={autoResetActive ? cancelAutoReset : undefined}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

        {/* ── Hero result block ── */}
        <View style={styles.heroBlock}>
          <Text style={styles.icon}>{theme.icon}</Text>
          <Text style={[styles.statusLabel, { color: theme.accent }]}>
            {resultState === 'loading' ? 'Performing cryptographic proof…' : theme.label}
          </Text>

          {/* Stale cache warning — amber banner, doesn't block the result */}
          {merkleStale && resultState !== 'loading' && (
            <View style={styles.staleBanner}>
              <Text style={styles.staleText}>⚠️  Registry cache {`>`}6h old — revokes may be delayed</Text>
            </View>
          )}

          {studentInfo && resultState !== 'loading' && (
            <View style={styles.studentCard}>
              <Text style={styles.studentName}>
                {studentInfo.name || '—'}
              </Text>
              {studentInfo.rollNumber && (
                <Text style={styles.studentMeta}>Roll: {studentInfo.rollNumber}</Text>
              )}
              {studentInfo.department && (
                <Text style={styles.studentMeta}>Dept: {studentInfo.department}</Text>
              )}
            </View>
          )}

          {errorMsg && resultState !== 'loading' && (
            <Text style={[styles.errorMsg, { color: theme.accent }]}>{errorMsg}</Text>
          )}

          <Text style={styles.timestamp}>
            {resultState !== 'loading' && `Verified at ${new Date().toLocaleTimeString()}`}
          </Text>
        </View>

        {/* ── Collapsible crypto details ── */}
        {cryptoInfo && resultState !== 'loading' && (
          <TouchableOpacity
            onPress={() => { cancelAutoReset(); setShowDetails(d => !d); }}
            style={styles.detailsToggle}
          >
            <Text style={[styles.detailsToggleText, { color: theme.accent }]}>
              {showDetails ? 'Hide Details ▲' : 'Show Crypto Details ▼'}
            </Text>
          </TouchableOpacity>
        )}

        {showDetails && cryptoInfo && (
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Integrity</Text>
              <Text style={styles.detailValue}>
                {resultState === 'pass' ? 'Canonical Matched' : 'Signature Mismatch'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recovered</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                {cryptoInfo.recoveredAddress || '—'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Issuer</Text>
              <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">
                {cryptoInfo.issuerAddress || '—'}
              </Text>
            </View>
          </View>
        )}

        {/* ── Buttons ── */}
        {resultState !== 'loading' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.scanAgainBtn, { borderColor: theme.accent }]}
              onPress={() => navigation.navigate('Scanner')}
              activeOpacity={0.8}
            >
              <Text style={[styles.scanAgainText, { color: theme.accent }]}>Scan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Auto-reset countdown ── */}
        {autoResetActive && (
          <Text style={styles.countdown}>
            Auto-scan in {countdown}s  •  tap anywhere to cancel
          </Text>
        )}

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 72,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  studentCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  studentName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  studentMeta: {
    fontSize: 18,
    color: '#A0A0A0',
    marginBottom: 4,
  },
  errorMsg: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#555',
    marginTop: 12,
  },
  detailsToggle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailsToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#666',
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    color: '#CCC',
    fontSize: 13,
    flex: 2,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scanAgainBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countdown: {
    textAlign: 'center',
    color: '#555',
    fontSize: 13,
    marginBottom: 24,
  },
  staleBanner: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  staleText: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
