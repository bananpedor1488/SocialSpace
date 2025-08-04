import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

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
  
  // Состояния для транзакций
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  // Функция загрузки транзакций
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция обработки клика по транзакции
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  // Функция открытия истории транзакций
  const openHistory = () => {
    setShowHistory(true);
    loadTransactions(); // Загружаем транзакции при открытии
  };

  const value = {
    showTransfer,
    setShowTransfer,
    showHistory,
    setShowHistory,
    showPremium,
    setShowPremium,
    showGiftPremium,
    setShowGiftPremium,
    // Добавляем состояния и функции транзакций
    transactions,
    selectedTransaction,
    setSelectedTransaction,
    showTransactionDetails,
    setShowTransactionDetails,
    loading,
    setLoading,
    loadTransactions,
    handleTransactionClick,
    openHistory,
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
}; 