import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

interface AuthContextType {
    user: User | null | any;
    loading: boolean;
    setMockUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setMockUser: () => { } });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null | any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const setMockUser = (mockUser: any) => {
        setUser(mockUser);
    }

    return (
        <AuthContext.Provider value={{ user, loading, setMockUser }}>
            {children}
        </AuthContext.Provider>
    );
};
