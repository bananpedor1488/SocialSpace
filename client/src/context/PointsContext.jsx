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
      const response = await axios.get('https://server-1-ewdd.onrender.com/api/points/transactions');
      console.log('Ответ сервера:', response.data);
      // Проверяем структуру ответа и устанавливаем правильный массив
      if (response.data && response.data.transactions) {
        setTransactions(response.data.transactions);
      } else if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
      setTransactions([]);
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