'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthResponse } from '@/types/api';
import { api, getAuthToken, setAuthToken } from './api-client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
    } catch (error: any) {
      // Invalid or expired token
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.post<AuthResponse>(
        '/auth/login',
        { email, password },
        { requiresAuth: false }
      );

      const token = res.data.access_token;
      setAuthToken(token);

      if (res.data.user) {
        setUser(res.data.user);
      } else {
        await fetchCurrentUser();
      }

      toast.success('Welcome back!', {
        description: `Signed in as ${res.data.user?.name || email}`,
      });
      return true;
    } catch (error: any) {
      toast.error('Sign in failed', {
        description: error.message || 'Please verify your credentials and try again.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.post<AuthResponse>(
        '/auth/register',
        { name, email, password, phone },
        { requiresAuth: false }
      );

      const token = res.data.access_token;
      setAuthToken(token);

      if (res.data.user) {
        setUser(res.data.user);
      } else {
        await fetchCurrentUser();
      }

      toast.success('Registration successful!', {
        description: `Welcome to the Hajj & Umrah Portal, ${name}!`,
      });
      return true;
    } catch (error: any) {
      toast.error('Registration failed', {
        description: error.message || 'Could not complete registration.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
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
