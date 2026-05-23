import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import {
  getCurrentUser, setCurrentUserId, clearCurrentUser, getUserByEmail
} from '../utils/storage';


// Handles authentication of users so any component can access the current one
// Reads stored UserID from localStorage and loads the full object 'user'
// Refreshing the page will therefore not logout the user.
interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshUser = useCallback(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (email: string, password: string): { success: boolean; message: string } => {
    const user = getUserByEmail(email);
    if (!user) return { success: false, message: 'No account found with this email address.' };
    if (user.password !== password)
      return { success: false, message: 'Incorrect password. Please try again.' };
    setCurrentUserId(user.id);
    setCurrentUser(user);
    return { success: true, message: `Welcome back, ${user.name}!` };
  };

  const logout = () => {
    clearCurrentUser();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
