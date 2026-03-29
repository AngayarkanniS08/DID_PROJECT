import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Verifier, DIDGenerator } from '@secure-verify/did-core';
import { historyService } from '../services/History.service';

export const ResultScreen = ({ route, navigation }: any) => {
  const { rawScannedData } = route.params || {};

  const [state, setState] = React.useState<any>({
    loading: !!rawScannedData,
    success: route.params?.success || false,
    recoveredAddress: route.params?.recoveredAddress,
    issuerAddress: route.params?.issuerAddress,
    error: route.params?.error,
    originalData: route.params?.originalData
  });

  React.useEffect(() => {
    if (rawScannedData) {
      performVerification(rawScannedData);
    }
  }, [rawScannedData]);

  const performVerification = async (data: string) => {
    try {
      const credential = JSON.parse(data);
      const issuerDID = credential.issuer || credential.iss;
      if (!issuerDID) throw new Error("Invalid credential: No issuer DID found");
      const issuerAddress = DIDGenerator.extractAddress(issuerDID);
      
      const result = Verifier.verifyIdentity(credential, issuerAddress);
      
      const newState = {
        loading: false,
        success: result.isValid,
        recoveredAddress: result.recoveredAddress,
        issuerAddress: issuerAddress,
        error: result.error,
        originalData: credential
      };

      setState(newState);

      // 💾 PERSIST TO LOCAL HISTORY (100% OFFLINE)
      await historyService.saveScan({
          name: credential.credentialSubject?.name || 'Unknown',
          rollNumber: credential.credentialSubject?.rollNumber || 'N/A',
          status: result.isValid ? 'success' : 'failed',
          recoveredAddress: result.recoveredAddress,
          issuerAddress: issuerAddress
      });

    } catch (err: any) {
      setState({
        loading: false,
        success: false,
        error: `Verification Error: ${err.message}`
      });
    }
  };

  const { success, recoveredAddress, issuerAddress, error, originalData, loading } = state;

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.content}>
           <Text style={[styles.title, { marginTop: 100 }]}>Verifying...</Text>
           <Text style={styles.timestamp}>Performing cryptographic proof</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.iconContainer, !success && styles.iconContainerError]}>
             <Text style={styles.icon}>{success ? '✅' : '❌'}</Text>
          </View>

          <Text style={styles.title}>
            {success ? 'Authentic Identity' : 'Verification Failed'}
          </Text>
          
          <Text style={styles.timestamp}>
            Scan Time: {new Date().toLocaleTimeString()}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Verification Summary</Text>
            
            {error && (
              <View style={styles.row}>
                <Text style={styles.label}>Error</Text>
                <Text style={styles.valueError}>{error}</Text>
              </View>
            )}

            <View style={styles.row}>
              <Text style={styles.label}>Recovered Address</Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                {recoveredAddress || 'Unknown'}
              </Text>
            </View>

            <View style={styles.row}>
               <Text style={styles.label}>Issuer Address</Text>
               <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                 {issuerAddress || 'N/A'}
               </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Integrity</Text>
              <Text style={styles.value}>{success ? 'Canonical Matched' : 'Signature Mismatch'}</Text>
            </View>
            
            {originalData?.type && (
              <View style={styles.row}>
                <Text style={styles.label}>Credential Type</Text>
                <Text style={styles.value}>{Array.isArray(originalData.type) ? originalData.type.join(', ') : originalData.type}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  iconContainerError: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  timestamp: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginTop: 40,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  label: {
    color: '#A0A0A0',
    fontSize: 14,
    flex: 1,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 2,
    marginLeft: 10,
  },
  valueError: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    flex: 2,
    marginLeft: 10,
  },
  doneButton: {
    backgroundColor: '#333333',
    paddingVertical: 18,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

