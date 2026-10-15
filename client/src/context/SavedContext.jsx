import React, { createContext, useContext, useState, useEffect } from 'react';

const SavedContext = createContext();

export const SavedProvider = ({ children }) => {
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('homerent_saved_properties');
      return stored ? JSON.parse(stored) : ['prop_001', 'prop_003', 'prop_005'];
    } catch {
      return ['prop_001', 'prop_003'];
    }
  });

  useEffect(() => {
    localStorage.setItem('homerent_saved_properties', JSON.stringify(savedIds));
  }, [savedIds]);

  const toggleSave = (propertyId) => {
    setSavedIds(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const isSaved = (propertyId) => savedIds.includes(propertyId);

  return (
    <SavedContext.Provider value={{ savedIds, toggleSave, isSaved, totalSaved: savedIds.length }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => useContext(SavedContext);
