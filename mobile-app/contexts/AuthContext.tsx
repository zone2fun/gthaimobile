import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    isAuthenticated: boolean;
    user: any | null;
    token: string | null;
    login: (userData: any, authToken: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
    loading: boolean;
    blockedUsers: string[];
    addBlockedUser: (userId: string) => void;
    removeBlockedUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

    // Load auth state from storage on mount
    useEffect(() => {
        loadAuthState();
    }, []);

    const loadAuthState = async () => {
        try {
            const [storedToken, storedUser] = await Promise.all([
                AsyncStorage.getItem(AUTH_TOKEN_KEY),
                AsyncStorage.getItem(AUTH_USER_KEY),
            ]);

            if (storedToken && storedUser) {
                setToken(storedToken);
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                if (parsedUser.blockedUsers) {
                    setBlockedUsers(parsedUser.blockedUsers);
                }
                setIsAuthenticated(true);
                console.log('Auth state loaded from storage');
            }
        } catch (error) {
            console.error('Error loading auth state:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData: any, authToken: string) => {
        try {
            await Promise.all([
                AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken),
                AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
            ]);

            setUser(userData);
            setToken(authToken);
            if (userData.blockedUsers) {
                setBlockedUsers(userData.blockedUsers);
            }
            setIsAuthenticated(true);
            console.log('User logged in:', userData.name);
        } catch (error) {
            console.error('Error saving auth state:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await Promise.all([
                AsyncStorage.removeItem(AUTH_TOKEN_KEY),
                AsyncStorage.removeItem(AUTH_USER_KEY),
            ]);

            setUser(null);
            setToken(null);
            setBlockedUsers([]);
            setIsAuthenticated(false);
            console.log('User logged out');
        } catch (error) {
            console.error('Error clearing auth state:', error);
        }
    };

    const updateUser = async (userData: any) => {
        try {
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
            setUser(userData);
            if (userData.blockedUsers) {
                setBlockedUsers(userData.blockedUsers);
            }
            console.log('User data updated:', userData.name);
        } catch (error) {
            console.error('Error updating user data:', error);
            throw error;
        }
    };

    const addBlockedUser = (userId: string) => {
        setBlockedUsers(prev => {
            if (prev.includes(userId)) return prev;
            const newBlocked = [...prev, userId];
            // Also update the user object in storage/state to persist this change locally
            if (user) {
                const updatedUser = { ...user, blockedUsers: newBlocked };
                updateUser(updatedUser).catch(console.error);
            }
            return newBlocked;
        });
    };

    const removeBlockedUser = (userId: string) => {
        setBlockedUsers(prev => {
            const newBlocked = prev.filter(id => id !== userId);
            // Also update the user object in storage/state to persist this change locally
            if (user) {
                const updatedUser = { ...user, blockedUsers: newBlocked };
                updateUser(updatedUser).catch(console.error);
            }
            return newBlocked;
        });
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, updateUser, loading, blockedUsers, addBlockedUser, removeBlockedUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
