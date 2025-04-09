import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUser } from '../lib/client';

type AuthContextType = {
    isAuthenticated: boolean;
    isLoading: boolean;
    checkAuthStatus: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provides authentication state and logic to the app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkAuthStatus = async (): Promise<boolean> => {
        try {
            const user = await getStoredUser();
            const isLoggedIn = !!user;
            setIsAuthenticated(isLoggedIn);
            return isLoggedIn;
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsAuthenticated(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuthStatus }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to access authentication context values
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
