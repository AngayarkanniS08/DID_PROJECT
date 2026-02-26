import { api } from './api';

export const setupService = {
    async saveOrganization(frontendData: any) {
        // Map frontend formData keys to match Organization entity columns
        const payload = {
            name: frontendData.institutionName,
            shortCode: frontendData.shortCode || 'SV',
            website: frontendData.website,
            departments: frontendData.departments,
            roles: frontendData.roles || [],
            accessZones: frontendData.accessZones || [],
            validity: frontendData.validity || '4y',
            autoRevoke: frontendData.autoRevoke ?? true,
            qrWatermark: frontendData.qrWatermark ?? true,
            expiryNotify: frontendData.expiryNotify ?? true,
            staffVerifierRoles: frontendData.staffVerifierRoles || [],
            importMethod: frontendData.importMethod || 'csv',
            isSetupComplete: true,
        };

        try {
            const response = await api.post('/setup', payload);
            return response.data;
        } catch (error) {
            console.error('Failed to save organization setup:', error);
            throw error;
        }
    },

    async getStatus() {
        try {
            const response = await api.get('/setup/status');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch setup status:', error);
            throw error;
        }
    }
};
