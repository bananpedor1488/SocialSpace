import React, { createContext, useContext, useState } from 'react';

const PointsContext = createContext();

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

export const PointsProvider = ({ children }) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showGiftPremium, setShowGiftPremium] = useState(false);

  const value = {
    showTransfer,
    setShowTransfer,
    showHistory,
    setShowHistory,
    showPremium,
    setShowPremium,
    showGiftPremium,
    setShowGiftPremium,
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
}; 