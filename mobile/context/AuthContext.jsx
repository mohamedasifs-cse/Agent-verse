import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredSession() {
      try {
        const session = await authService.getCurrentSession();
        if (session) {
          setUser(session.user);
          setToken(session.token);
        }
      } catch (e) {
        console.warn('[AuthContext] Restore session error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredSession();
  }, []);

  const login = async (vehicleName, pin, vehicleType = 'car') => {
    setIsLoading(true);
    try {
      const res = await authService.login(vehicleName, pin, vehicleType);
      setUser(res.user);
      setToken(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (vehicleName, vehicleType, pin, capacity, range) => {
    setIsLoading(true);
    try {
      const res = await authService.register(vehicleName, vehicleType, pin, capacity, range);
      setUser(res.user);
      setToken(res.token);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
