/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { G, Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Constants from 'expo-constants';
import * as LocalAuthentication from 'expo-local-authentication';
import { StorageService, CredentialData } from './services/StorageService';
import { TOTPService } from './services/TOTPService';
import QRCode from 'react-native-qrcode-svg';
import { Signer, KeyManager } from '@secure-verify/did-core';


export const App = () => {
  const [whatsNextYCoord, setWhatsNextYCoord] = useState<number>(0);
  const scrollViewRef = useRef<null | ScrollView>(null);
  const [credential, setCredential] = useState<CredentialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDigilockerLoading, setIsDigilockerLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [qrValue, setQrValue] = useState<string>('');

  const apiUrl = Constants?.expoConfig?.extra?.apiUrl || 'http://192.168.1.5:3001';


  useEffect(() => {
    // Load cached credential on mount
    const loadCached = async () => {
      try {
        const cached = await StorageService.getCredential();
        if (cached) {
          setCredential(cached);
          // If we have a credential, start TOTP
          if (cached.payload) {
            const secret = JSON.parse(cached.payload).totpSecret || 'ABCDEF1234567890';
            setTotpCode(TOTPService.generateCode(secret));
          }
        }
      } catch (e) {
        console.error('Failed to load cached credential', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadCached();

    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      parseDeepLink(url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        parseDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // TOTP Rotation Timer
  useEffect(() => {
    if (!credential) return;

    const interval = setInterval(() => {
      const remaining = TOTPService.getSecondsRemaining();
      setSecondsRemaining(remaining);

      if (remaining === 30 || totpCode === '') {
        const secret = credential.payload ? (JSON.parse(credential.payload).totpSecret || 'ABCDEF123456') : 'ABCDEF123456';
        setTotpCode(TOTPService.generateCode(secret));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [credential, totpCode]);

  // Dynamic QR Code Generation (Anti-Replay / Holders Binding)
  useEffect(() => {
    let interval: any;

    const generateLiveProof = async () => {
      if (!credential || !isFlipped) return;
      try {
        const pk = await StorageService.getPrivateKey();
        if (!pk) {
          setQrValue(credential.payload || '');
          return;
        }

        const wallet = KeyManager.getWalletFromPrivateKey(pk);
        const timestamp = Math.floor(Date.now() / 1000);

        // Sign the current timestamp to prove liveness (Holders Binding)
        const sig = await Signer.signMessage(timestamp.toString(), wallet);

        // Combine with VC into a 'Live Proof' container
        const liveProof = {
          vc: JSON.parse(credential.payload || '{}'),
          t: timestamp,
          s: sig
        };
        setQrValue(JSON.stringify(liveProof));
      } catch (err) {
        console.error('Failed to generate dynamic QR:', err);
        setQrValue(credential.payload || '');
      }
    };

    if (isFlipped && credential) {
      generateLiveProof();
      interval = setInterval(generateLiveProof, 10000);
    } else if (credential) {
      setQrValue(credential.payload || '');
    }

    return () => clearInterval(interval);
  }, [isFlipped, credential]);

  const parseDeepLink = (url: string) => {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      console.log('Parsed deep link:', params);

      // Handle DigiLocker Callback
      if (url.includes('digilocker-callback') && params.code) {
        handleDigiLockerCallback(params.code);
        return;
      }

      if (params.did || params.payload) {

        let credentialData: CredentialData = {
          did: params.did,
          name: params.name,
          roll: params.roll,
          iss: params.iss,
        };

        if (params.payload) {
          try {
            const decodedPayload = JSON.parse(
              decodeURIComponent(params.payload),
            );
            credentialData = { ...credentialData, ...decodedPayload };
          } catch (e) {
            credentialData.payload = params.payload;
          }
        }

        setCredential(credentialData);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing deep link:', error);
      setIsLoading(false);
    }
  };

  const handleDigiLockerVerify = async () => {
    try {
      setIsDigilockerLoading(true);
      const response = await fetch(`${apiUrl}/api/digilocker/auth-url`);
      const data = await response.json();
      if (data.url) {
        Linking.openURL(data.url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to DigiLocker. Please try again.');
    } finally {
      setIsDigilockerLoading(false);
    }
  };

  const handleDigiLockerCallback = async (code: string) => {
    try {
      setIsDigilockerLoading(true);
      const response = await fetch(`${apiUrl}/api/digilocker/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (data.success && data.credential) {
        const credData: CredentialData = {
          did: data.did,
          name: data.studentName,
          roll: data.rollNumber,
          payload: JSON.stringify(data.credential.payload),
        };
        setCredential(credData);
        await StorageService.saveCredential(credData);

        // Start TOTP
        const secret = data.totpSecret || data.credential.payload.totpSecret;
        if (secret) {
          setTotpCode(TOTPService.generateCode(secret));
        }

        Alert.alert('Success', 'Credential verified and issued via DigiLocker!');
      } else {
        Alert.alert('Verification Failed', data.message || 'Identity could not be matched.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process DigiLocker verification.');
    } finally {
      setIsDigilockerLoading(false);
      setIsLoading(false);
    }
  };

  const handleRevealQR = async () => {
    if (isFlipped) {
      setIsFlipped(false);
      return;
    }

    setIsAuthenticating(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify identity to reveal QR code',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setIsFlipped(true);
        }
      } else {
        setIsFlipped(true);
      }
    } catch (e) {
      Alert.alert('Auth Error', 'Could not authenticate. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to clear your credentials?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await StorageService.clearAll();
          setCredential(null);
          setTotpCode('');
        }
      }
    ]);
  };


  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#0f172a' }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={[styles.textMd, { color: '#94a3b8', marginTop: 16 }]}>Loading Wallet...</Text>
      </View>
    );
  }

  if (credential) {
    return (
      <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>

          {/* The Hero Card */}
          <TouchableOpacity activeOpacity={0.9} onPress={handleRevealQR} style={styles.cardContainer}>
            {!isFlipped ? (
              /* CARD FRONT */
              <View style={styles.heroCardFront}>
                <View style={styles.cardGlass}>
                  <View style={styles.cardHeaderSmall}>
                    <Text style={styles.cardIssuerText}>SECURE VERIFY • STUDENT ID</Text>
                    <TouchableOpacity onPress={handleLogout}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#94a3b8">
                        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </Svg>
                    </TouchableOpacity>

                  </View>

                  <View style={styles.cardMainInfo}>
                    <View style={styles.photoContainer}>
                      <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop' }}
                        style={styles.profilePhoto}
                      />
                    </View>
                    <View style={styles.textInfo}>
                      <Text style={styles.heroName}>{credential.name || 'Student Name'}</Text>
                      <Text style={styles.heroRoll}>{credential.roll || '20CS001'}</Text>
                      <Text style={styles.heroDept}>Computer Science Engineering</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.footerLabel}>DID IDENTIFIER</Text>
                      <Text style={styles.footerValue}>{credential.did?.substring(0, 24)}...</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>ACTIVE</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              /* CARD BACK (QR REVEAL) */
              <View style={styles.heroCardBack}>
                <View style={[styles.cardGlass, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.cardIssuerText, { marginBottom: 20 }]}>SECURE VERIFICATION CODE</Text>

                  <View style={styles.qrWrapper}>
                    <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 16 }}>
                      <QRCode
                        value={qrValue || 'placeholder'}
                        size={180}
                        backgroundColor="transparent"
                        color="#10b981"
                        ecl="M"
                      />
                    </View>
                  </View>

                  <View style={styles.totpContainer}>
                    <Text style={styles.totpLabel}>DYNAMIC PASSCODE</Text>
                    <Text style={styles.totpCode}>{totpCode || 'XXX XXX'}</Text>
                    <View style={styles.timerBarBg}>
                      <View style={[styles.timerBarFill, { width: `${(secondsRemaining / 30) * 100}%` }]} />
                    </View>
                    <Text style={styles.timerText}>Refreshes in {secondsRemaining}s</Text>
                  </View>

                  <Text style={styles.tapToClose}>Tap to hide</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Tap the card to reveal your secure QR code for verification.
            </Text>
          </View>

          {isAuthenticating && (
            <View style={styles.authOverlay}>
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text style={styles.authText}>Authenticating...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, paddingTop: 80, paddingBottom: 48 }}>

        {/* Header */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 1, borderColor: '#3b82f6' }}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#60a5fa">
              <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </Svg>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' }}>
            SecureVerify
          </Text>
          <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            Your decentralized student identity wallet. Verified. Secure. Instant.
          </Text>
        </View>

        {/* Feature Pills */}
        <View style={{ width: '100%', gap: 12 }}>
          {[
            { icon: '🔐', label: 'Biometric Protected', desc: 'Face ID / Fingerprint gated' },
            { icon: '🔗', label: 'Blockchain Anchored', desc: 'Polygon Amoy Testnet' },
            { icon: '📱', label: 'Works Offline', desc: 'Crypto verified, no internet needed' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 22, marginRight: 14 }}>{item.icon}</Text>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#f1f5f9' }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={{ width: '100%', gap: 12 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 18, gap: 10, opacity: isDigilockerLoading ? 0.7 : 1 }}
            onPress={handleDigiLockerVerify}
            disabled={isDigilockerLoading}
          >
            {isDigilockerLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#ffffff">
                  <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </Svg>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Verify with DigiLocker</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRadius: 16, paddingVertical: 16, gap: 8, borderWidth: 1, borderColor: '#334155' }}
            onPress={async () => {
              try {
                setIsDigilockerLoading(true);
                const response = await fetch(`${apiUrl}/api/digilocker/callback`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: 'MOCK_CODE_ALICE' }),
                });
                const data = await response.json();
                if (data.success) {
                  const credData: CredentialData = {
                    did: data.did,
                    name: data.studentName,
                    roll: data.rollNumber,
                    payload: JSON.stringify(data.credential.payload),
                  };
                  setCredential(credData);
                  await StorageService.saveCredential(credData);
                  const secret = data.totpSecret || data.credential?.payload?.totpSecret;
                  if (secret) setTotpCode(TOTPService.generateCode(secret));
                } else {
                  Alert.alert('Demo Failed', data.message || 'Check that api-issuer is running.');
                }
              } catch {
                Alert.alert('Connection Error', 'Make sure the backend is running on port 3001.');
              } finally {
                setIsDigilockerLoading(false);
              }
            }}
          >
            <Text style={{ fontSize: 12, color: '#f59e0b' }}>⚡</Text>
            <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600' }}>Demo Mode (Mock)</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    backgroundColor: '#ffffff',
  },
  codeBlock: {
    backgroundColor: 'rgba(55, 65, 81, 1)',
    marginVertical: 12,
    padding: 12,
    borderRadius: 4,
  },
  monospace: {
    color: '#ffffff',
    fontFamily: 'Courier New',
    marginVertical: 4,
  },
  comment: {
    color: '#cccccc',
  },
  marginBottomSm: {
    marginBottom: 6,
  },
  marginBottomMd: {
    marginBottom: 18,
  },
  marginBottomLg: {
    marginBottom: 24,
  },
  textLight: {
    fontWeight: '300',
  },
  textBold: {
    fontWeight: '500',
  },
  textCenter: {
    textAlign: 'center',
  },
  text2XS: {
    fontSize: 12,
  },
  textXS: {
    fontSize: 14,
  },
  textSm: {
    fontSize: 16,
  },
  textMd: {
    fontSize: 18,
  },
  textLg: {
    fontSize: 24,
  },
  textXL: {
    fontSize: 48,
  },
  textContainer: {
    marginVertical: 12,
  },
  textSubtle: {
    color: '#6b7280',
  },
  section: {
    marginVertical: 12,
    marginHorizontal: 12,
  },
  shadowBox: {
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: {
      width: 1,
      height: 4,
    },
    shadowRadius: 12,
    padding: 24,
    marginBottom: 24,
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  appTitleText: {
    paddingTop: 12,
    fontWeight: '500',
  },
  hero: {
    borderRadius: 12,
    backgroundColor: '#143055',
    padding: 36,
    marginBottom: 24,
  },
  heroTitle: {
    flex: 1,
    flexDirection: 'row',
  },
  heroTitleText: {
    color: '#ffffff',
    marginLeft: 12,
  },
  heroText: {
    color: '#ffffff',
    marginVertical: 12,
  },

  connectToCloudButton: {
    backgroundColor: 'rgba(20, 48, 85, 1)',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    width: '50%',
  },

  connectToCloudButtonText: {
    color: '#ffffff',
  },
  whatsNextButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 8,
    width: '50%',
    marginTop: 24,
  },
  learning: {
    marginVertical: 12,
  },
  love: {
    marginTop: 12,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  credentialCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: 'black',
    shadowOpacity: 0.15,
    shadowOffset: { width: 1, height: 4 },
    shadowRadius: 12,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#10b981',
  },
  cardBody: {
    alignItems: 'center',
  },
  credentialName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  credentialText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  credentialStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 12,
  },
  digilockerButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  digilockerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Hero Card Styles */
  cardContainer: {
    width: Dimensions.get('window').width - 40,
    height: 450,
    borderRadius: 24,
    marginBottom: 30,
    // Note: React Native does not support true 3D flip without Reanimated/Moti,
    // but we can simulate it with conditional rendering for now as a high-fidelity mock.
  },
  heroCardFront: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  heroCardBack: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  cardGlass: {
    flex: 1,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIssuerText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  cardMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#60a5fa',
    padding: 3,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  textInfo: {
    flex: 1,
  },
  heroName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroRoll: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  heroDept: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  footerLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerValue: {
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
  },

  /* QR / TOTP Styles */
  qrWrapper: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  totpContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  totpLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  totpCode: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  timerBarBg: {
    width: '60%',
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
  },
  timerText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 8,
  },
  tapToClose: {
    color: '#475569',
    fontSize: 12,
    marginTop: 20,
  },

  instructions: {
    marginTop: 10,
    paddingHorizontal: 40,
  },
  instructionText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },

  authOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  authText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});


export default App;
