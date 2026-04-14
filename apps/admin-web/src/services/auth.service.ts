import { api } from './api';

interface LoginResult {
    success: boolean;
    isSetupComplete: boolean;
}

export const authService = {
    async login(email?: string, password?: string): Promise<LoginResult> {
        try {
            // DEV BYPASS: No credentials = skip auth
            if (!email || !password) {
                console.warn('DEV MODE: Bypassing authentication.');
                localStorage.setItem('token', 'dev-bypass-token');
                return { success: true, isSetupComplete: true };
            }

            // Real API call — keys must match what backend controller reads
            const response = await api.post('/auth/login', { email, password });

            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                return { success: true, isSetupComplete: response.data.isSetupComplete };
            }
            return { success: false, isSetupComplete: false };
        } catch (error) {
            console.error('Backend connection failed:', error);
            throw error;
        }
    },

    async logout() {
        localStorage.removeItem('token');
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};