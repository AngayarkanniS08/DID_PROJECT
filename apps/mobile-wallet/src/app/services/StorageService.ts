import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VC_KEY = 'SV_STUDENT_VC';
const PRIVATE_KEY_KEY = 'SV_STUDENT_PRIVATE_KEY';

export interface CredentialData {
  did?: string;
  name?: string;
  roll?: string;
  payload?: string;
  iss?: string;
}

export class StorageService {
  static async saveCredential(credential: CredentialData): Promise<void> {
    await AsyncStorage.setItem(VC_KEY, JSON.stringify(credential));
  }

  static async getCredential(): Promise<CredentialData | null> {
    const data = await AsyncStorage.getItem(VC_KEY);
    return data ? JSON.parse(data) : null;
  }

  static async savePrivateKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(PRIVATE_KEY_KEY, key);
  }

  static async getPrivateKey(): Promise<string | null> {
    return await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
  }

  static async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(VC_KEY);
    await SecureStore.deleteItemAsync(PRIVATE_KEY_KEY);
  }
}
