// src/services/student.service.ts
import { api } from './api';

export const studentService = {
    bulkImport: async (organizationId: string, students: any[]) => {
        try {
            const response = await api.post(`/students/upload`, {
                organizationId,
                students,
            });
            return response.data;
        } catch (error) {
            console.error('Bulk Import Error:', error);
            throw error;
        }
    },
    getAllStudents: async () => {
        try {
            const response = await api.get(`/students`);
            return response.data;
        } catch (error) {
            console.error('Fetch Students Error:', error);
            throw error;
        }
    },
    getStudentById: async (id: string) => {
        try {
            const response = await api.get(`/students/${id}`);
            return response.data;
        } catch (error) {
            console.error('Fetch Student Error:', error);
            throw error;
        }
    },
    batchIssue: async (ids: string[]) => {
        try {
            const response = await api.post(`/students/batch-issue`, { ids });
            return response.data;
        } catch (error) {
            console.error('Batch Issue Error:', error);
            throw error;
        }
    },
    getIssuerConfig: async () => {
        try {
            const response = await api.get(`/students/config/issuer`);
            return response.data;
        } catch (error) {
            console.error('Get Issuer Config Error:', error);
            throw error;
        }
    },
    createStudent: async (studentData: any) => {
        try {
            const response = await api.post(`/students`, studentData);
            return response.data;
        } catch (error) {
            console.error('Create Student Error:', error);
            throw error;
        }
    },
    verifyCredential: async (payload: any) => {
        try {
            const response = await api.post(`/students/verify`, payload);
            return response.data;
        } catch (error) {
            console.error('Verification Error:', error);
            throw error;
        }
    },
    sendCredentialEmail: async (id: string) => {
        try {
            const response = await api.post(`/students/${id}/send-email`);
            return response.data;
        } catch (error) {
            console.error('Send Email Error:', error);
            throw error;
        }
    },
    batchSendEmails: async (ids: string[]) => {
        try {
            const response = await api.post(`/students/batch-send-email`, { ids });
            return response.data;
        } catch (error) {
            console.error('Batch Send Email Error:', error);
            throw error;
        }
    },
    revokeStudent: async (id: string) => {
        try {
            const response = await api.post(`/students/${id}/revoke`);
            return response.data;
        } catch (error) {
            console.error('Revoke Error:', error);
            throw error;
        }
    },
};