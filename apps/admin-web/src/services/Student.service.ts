// src/services/student.service.ts
import axios from 'axios';

// Note: Replace with your actual backend URL or use an Axios instance
const API_URL = 'http://localhost:3000/api';

export const studentService = {
    bulkImport: async (organizationId: string, students: any[]) => {
        try {
            const response = await axios.post(`${API_URL}/students/upload`, {
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
            const response = await axios.get(`${API_URL}/students`);
            return response.data;
        } catch (error) {
            console.error('Fetch Students Error:', error);
            throw error;
        }
    },
    getStudentById: async (id: string) => {
        try {
            const response = await axios.get(`${API_URL}/students/${id}`);
            return response.data;
        } catch (error) {
            console.error('Fetch Student Error:', error);
            throw error;
        }
    },
    batchIssue: async (ids: string[]) => {
        try {
            const response = await axios.post(`${API_URL}/students/batch-issue`, { ids });
            return response.data;
        } catch (error) {
            console.error('Batch Issue Error:', error);
            throw error;
        }
    }
};