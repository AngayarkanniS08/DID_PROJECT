import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';

export const ScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = React.useState(false);

  React.useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // 🫨 IMMEDIATE TACTILE FEEDBACK (Feels instant)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // ⚡️ INSTANT TRANSITION
    // We pass the raw data to the ResultScreen and let it handle the 'heavy' crypto
    // This makes the scanner feel 10x faster because the UI doesn't hang.
    navigation.navigate('Result', { 
      rawScannedData: data,
      isVerifying: true 
    });
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scan Credential QR</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          responsiveOrientationWhenInUse={true}
        />
        
        {/* Overlay scanning frame */}
        <View style={styles.overlay}>
           <View style={styles.unfocusedContainer}></View>
           <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.focusedContainer}></View>
              <View style={styles.unfocusedContainer}></View>
           </View>
           <View style={styles.unfocusedContainer}></View>
        </View>

        {/* Action Buttons */}
        <View style={styles.overlayBottom}>
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
    borderWidth: 2,
    borderColor: '#FB923C',
    borderRadius: 20,
    backgroundColor: 'transparent',
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
    fontWeight: 'bold'
  },
  scanAgainText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  processingOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FB923C',
    alignItems: 'center',
  },
  processingText: {
    color: '#FB923C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scanAgainButtonSmall: {
    marginTop: 15,
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scanAgainTextSmall: {
    color: '#FFF',
    fontSize: 14,
  }
});

