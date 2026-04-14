import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface AuthContextType {
    isAuthenticated: boolean;
    user: { id: number; email: string } | null;
    login: (email: string, password: string) => Promise<{ isSetupComplete: boolean }>;
    logout: () => void;
}

interface LoginResponse {
    access_token: string;
    isSetupComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{ id: number; email: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({ id: payload.sub, email: payload.email });
            } catch {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post<LoginResponse>('/auth/login', { email, password });
        const { access_token, isSetupComplete } = response.data;
        localStorage.setItem('token', access_token);
        setIsAuthenticated(true);

        try {
            const payload = JSON.parse(atob(access_token.split('.')[1]));
            setUser({ id: payload.sub, email: payload.email });
        } catch {
            // Token decode failed, but login succeeded
        }

        return { isSetupComplete };
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
    };

    if (loading) {
        return <div>Loading SecureVerify...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
