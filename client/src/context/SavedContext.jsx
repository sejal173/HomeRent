// client/src/context/SavedContext.jsx
// Manages saved/favorite properties synchronized with the backend.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserService } from '../services/api';
import { useAuth } from './AuthContext';

const SavedContext = createContext();

export const SavedProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('homerent_saved_properties');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // When user logs in, fetch their saved properties from the backend
  useEffect(() => {
    const fetchUserSaved = async () => {
      if (isAuthenticated) {
        try {
          const res = await UserService.getSaved();
          if (res.success && Array.isArray(res.properties)) {
            const ids = res.properties.map((p) => (typeof p === 'object' ? p._id : p));
            setSavedIds(ids);
            localStorage.setItem('homerent_saved_properties', JSON.stringify(ids));
          }
        } catch {
          // Keep existing local state if request fails
        }
      } else {
        setSavedIds([]);
        localStorage.removeItem('homerent_saved_properties');
      }
    };

    fetchUserSaved();
  }, [isAuthenticated, user?._id]);

  // Toggle save on backend
  const toggleSave = async (propertyId) => {
    if (!isAuthenticated) {
      return { success: false, requireAuth: true };
    }

    try {
      const res = await UserService.toggleSave(propertyId);
      setSavedIds((prev) => {
        let updated;
        if (res.saved) {
          updated = prev.includes(propertyId) ? prev : [...prev, propertyId];
        } else {
          updated = prev.filter((id) => id !== propertyId);
        }
        localStorage.setItem('homerent_saved_properties', JSON.stringify(updated));
        return updated;
      });
      return { success: true, saved: res.saved };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update saved property' };
    }
  };

  const isSaved = (propertyId) => savedIds.includes(propertyId);

  return (
    <SavedContext.Provider
      value={{
        savedIds,
        toggleSave,
        isSaved,
        totalSaved: savedIds.length,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => useContext(SavedContext);
