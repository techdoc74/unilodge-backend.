import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [authData, setAuthData] = useState({
    token: null,
    userId: null,
    authenticated: false,
  });

  const login = async (token, userId) => {
    setAuthData({ token, userId, authenticated: true });
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('userId', userId);
  };

  const logout = async () => {
    setAuthData({ token: null, userId: null, authenticated: false });
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userId');
  };

  const value = {
    ...authData,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}