import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const me = await authApi.me();
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      } catch {
        clearAuth();
        clearAuthError();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Reset any stale auth state before attempting a new login
      clearAuth();
      clearAuthError();
      const response = await authApi.login({ email, password });
      if (!response.access_token) {
        throw new Error('No access token received from server');
      }

      setToken(response.access_token);
      localStorage.setItem('token', response.access_token);

      const me = await authApi.me();
      setUser(me);
      localStorage.setItem('user', JSON.stringify(me));
    } catch (error: any) {
      clearAuth();
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      clearAuthError();
      const userResponse = await authApi.signup({ username, email, password });
      if (userResponse) {
        await login(email, password);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Signup failed';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    clearAuth();
    clearAuthError();
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isLoading,
    isAuthenticated,
    authError,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

