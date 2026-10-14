import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('sa_token');
      if (token) {
        try {
          const response = await authService.getMe();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('sa_token');
        }
      }
      setLoading(false);
    };
    checkAuth();

    // Active session polling for instant remote logout
    const pollInterval = setInterval(async () => {
      const token = localStorage.getItem('sa_token');
      if (token) {
        try {
          await authService.getMe();
        } catch (error) {
          // 401 is handled by api interceptor
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { token, user: userData } = response.data;
    localStorage.setItem('sa_token', token);
    setUser(userData);
    return userData;
  };

  const verifyOTP = async (phone, otp) => {
    const response = await authService.verifyOTP(phone, otp);
    const { token, user: userData } = response.data;
    localStorage.setItem('sa_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('sa_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      requestOTP: authService.requestOTP,
      verifyOTP,
      loading, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
