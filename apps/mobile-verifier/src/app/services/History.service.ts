import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@secure_verify_history';

export interface ScanRecord {
    id: string;
    timestamp: number;
    name: string;
    rollNumber: string;
    status: 'success' | 'failed';
    recoveredAddress: string;
    issuerAddress: string;
}

export const historyService = {
    async saveScan(record: Omit<ScanRecord, 'id' | 'timestamp'>) {
        try {
            const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
            const history: ScanRecord[] = rawHistory ? JSON.parse(rawHistory) : [];
            
            const newRecord: ScanRecord = {
                ...record,
                id: Math.random().toString(36).substring(7),
                timestamp: Date.now(),
            };
            
            // Keep latest 50 scans
            const updatedHistory = [newRecord, ...history].slice(0, 50);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
            return newRecord;
        } catch (err) {
            console.error('Failed to save scan history', err);
            return null;
        }
    },

    async getHistory(): Promise<ScanRecord[]> {
        try {
            const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
            return rawHistory ? JSON.parse(rawHistory) : [];
        } catch (err) {
            console.error('Failed to load scan history', err);
            return [];
        }
    },

    async clearHistory() {
        await AsyncStorage.removeItem(HISTORY_KEY);
    }
};
