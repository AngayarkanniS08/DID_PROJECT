import React, { useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

export const ScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scannedRef = useRef(false);

  // Reset scanner every time this screen mounts
  useEffect(() => {
    scannedRef.current = false;
    setScanned(false);
    setTorchOn(false);
  }, []);

  // Pulsing animation for scan frame
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  React.useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      setScanned(true);

      // 🫨 IMMEDIATE TACTILE FEEDBACK (Feels instant)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // ⚡️ INSTANT TRANSITION
      // We pass the raw data to the ResultScreen and let it handle the 'heavy' crypto
      // This makes the scanner feel 10x faster because the UI doesn't hang.
      navigation.navigate('Result', {
        rawScannedData: data,
        isVerifying: true,
      });
    },
    [navigation],
  );

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.mockButton} onPress={requestPermission}>
          <Text style={styles.mockButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Credential QR</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torchOn}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Dimmed overlay */}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer} />
            {/* Animated corner-bracket frame */}
            <View style={styles.focusedContainer}>
              <Animated.View
                style={[styles.corner, styles.cornerTL, { opacity: pulseAnim }]}
              />
              <Animated.View
                style={[styles.corner, styles.cornerTR, { opacity: pulseAnim }]}
              />
              <Animated.View
                style={[styles.corner, styles.cornerBL, { opacity: pulseAnim }]}
              />
              <Animated.View
                style={[styles.corner, styles.cornerBR, { opacity: pulseAnim }]}
              />
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
          <View style={styles.unfocusedContainer} />
        </View>

        {/* Torch + Cancel controls */}
        <View style={styles.overlayBottom}>
          <TouchableOpacity
            style={styles.torchButton}
            onPress={() => setTorchOn((t) => !t)}
          >
            <Text style={styles.torchButtonText}>
              {torchOn ? '🔦 ON' : '🔦 OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.infoText}>Hold your device over the QR code</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#FB923C',
    fontSize: 18,
    marginRight: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  focusedContainer: {
    width: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FB923C',
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  infoText: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  text: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
  },
  mockButton: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#FB923C',
    borderRadius: 10,
  },
  mockButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  torchButton: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderWidth: 1,
    borderColor: '#FB923C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  torchButtonText: {
    color: '#FB923C',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
