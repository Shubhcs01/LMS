'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('lms_token');
        const storedUser = localStorage.getItem('lms_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Verify with server in background
          try {
            const res = await api.getMe();
            if (res.user) {
              setUser(res.user);
              localStorage.setItem('lms_user', JSON.stringify(res.user));
            }
          } catch {
            // Token may have expired
            localStorage.removeItem('lms_token');
            localStorage.removeItem('lms_user');
            setUser(null);
            setToken(null);
          }
        }
      } catch (e) {
        console.error('Error loading stored auth state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.login({ email, password });
    const receivedToken = response.token;
    const receivedUser = response.user;

    localStorage.setItem('lms_token', receivedToken);
    localStorage.setItem('lms_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<User> => {
    const response = await api.register(userData);
    const receivedToken = response.token;
    const receivedUser = response.user;

    localStorage.setItem('lms_token', receivedToken);
    localStorage.setItem('lms_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('lms_user', JSON.stringify(res.user));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  // Quick switch role for evaluator testing convenience
  const switchRole = async (targetRole: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'admin@lms.com',
      [UserRole.SALES]: 'sales@lms.com',
      [UserRole.SANCTION]: 'sanction@lms.com',
      [UserRole.DISBURSEMENT]: 'disbursement@lms.com',
      [UserRole.COLLECTION]: 'collection@lms.com',
      [UserRole.BORROWER]: 'borrower@lms.com',
    };

    const targetEmail = roleEmailMap[targetRole];
    if (targetEmail) {
      await login(targetEmail, 'Password@123');
      if (targetRole === UserRole.BORROWER) {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchRole,
        refreshUser,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
