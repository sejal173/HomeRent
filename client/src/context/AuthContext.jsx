// client/src/context/AuthContext.jsx
// Manages authentication state (user info, token, login, register, logout) across the app.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Read saved user from localStorage (null if not logged in)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('homerent_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Sync user state with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('homerent_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('homerent_user');
    }
  }, [user]);

  // Real login: calls backend POST /api/auth/login and stores returned JWT
  const login = async (email, password) => {
    const data = await AuthService.login({ email, password });
    setUser(data);
    return data;
  };

  // Real registration: calls backend POST /api/auth/register and logs in
  const register = async (userData) => {
    const data = await AuthService.register(userData);
    setUser(data);
    return data;
  };

  // Logout: clears session
  const logout = () => {
    setUser(null);
    localStorage.removeItem('homerent_user');
    localStorage.removeItem('homerent_saved_properties');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLandlord: user?.role?.toLowerCase() === 'landlord',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
