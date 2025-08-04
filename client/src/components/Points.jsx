import React, { useState, useEffect } from 'react';
import { Coins, Send, History, Trophy, X, ChevronDown, ChevronUp, Crown, Gift } from 'lucide-react';
import axios from 'axios';
import Avatar from './Avatar';
import { usePoints } from '../context/PointsContext';

const Points = () => {
  const [balance, setBalance] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [premiumInfo, setPremiumInfo] = useState({
    active: false,
    expiresAt: null,
    premiumCost: 300
  });
  const [transferData, setTransferData] = useState({
    recipientUsername: '',
    amount: '',
    description: ''
  });
  const [giftData, setGiftData] = useState({
    recipientUsername: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { 
    showTransfer, setShowTransfer,
    showHistory, setShowHistory,
    showPremium, setShowPremium,
    showGiftPremium, setShowGiftPremium,
    openHistory
  } = usePoints();

  // Загрузить баланс
  const loadBalance = async () => {
    try {
      const response = await axios.get('https://server-u9ji.onrender.com/api/points/balance');
      setBalance(response.data.points);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };



  // Загрузить рейтинг
  const loadLeaderboard = async () => {
    try {
      const response = await axios.get('https://server-u9ji.onrender.com/api/points/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Загрузить информацию о премиуме
  const loadPremiumInfo = async () => {
    try {
      const response = await axios.get('https://server-u9ji.onrender.com/api/points/premium-info');
      setPremiumInfo(response.data.premium);
      setBalance(response.data.points);
    } catch (error) {
      console.error('Error loading premium info:', error);
    }
  };

  // Купить премиум
  const handleBuyPremium = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post('https://server-u9ji.onrender.com/api/points/buy-premium');
      
      setSuccess('Премиум успешно куплен!');
      setPremiumInfo(response.data.premium);
      setBalance(response.data.newBalance);
      setShowPremium(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка покупки премиума');
    } finally {
      setLoading(false);
    }
  };

  // Подарить премиум
  const handleGiftPremium = async (e) => {
    e.preventDefault();
    if (!giftData.recipientUsername) {
      setError('Укажите имя пользователя');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post('https://server-u9ji.onrender.com/api/points/gift-premium', giftData);
      
      setSuccess('Премиум успешно подарен!');
      setBalance(response.data.newBalance);
      setGiftData({ recipientUsername: '' });
      setShowGiftPremium(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка дарения премиума');
    } finally {
      setLoading(false);
    }
  };

  // Выполнить перевод
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferData.recipientUsername || !transferData.amount) {
      setError('Заполните все поля');
      return;
    }

    if (transferData.amount <= 0) {
      setError('Сумма должна быть больше 0');
      return;
    }

    if (transferData.amount > balance) {
      setError('Недостаточно баллов');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post('https://server-u9ji.onrender.com/api/points/transfer', transferData);
      
      setSuccess('Перевод выполнен успешно!');
      setBalance(response.data.newBalance);
      setTransferData({ recipientUsername: '', amount: '', description: '' });
      setShowTransfer(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка выполнения перевода');
    } finally {
      setLoading(false);
    }
  };

  // Форматировать дату
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Форматировать сумму
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };



  useEffect(() => {
    loadBalance();
    loadPremiumInfo();
  }, []);

  return (
    <div className="points-container">
      {/* Основная информация о баллах с выпадающим меню */}
      <div className="points-header">
        <div 
          className="points-balance clickable"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <Coins size={24} className="points-icon" />
          <div className="balance-info">
            <span className="balance-label">Ваши баллы</span>
            <span className="balance-amount">{formatAmount(balance)}</span>
          </div>
          {showDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Выпадающее меню */}
      {showDropdown && (
        <div className="points-dropdown show">
          <button 
            onClick={() => {
              setShowTransfer(!showTransfer);
              setShowHistory(false);
              setShowPremium(false);
              setShowGiftPremium(false);
              setShowDropdown(false);
            }}
            className="dropdown-item"
          >
            <Send size={16} />
            Перевести баллы
          </button>
          
          <button 
            onClick={() => {
              openHistory(); // Используем функцию из контекста
              setShowDropdown(false);
            }}
            className="dropdown-item"
          >
            <History size={16} />
            История транзакций
          </button>

          <button 
            onClick={() => {
              setShowPremium(!showPremium);
              setShowTransfer(false);
              setShowHistory(false);
              setShowGiftPremium(false);
              setShowDropdown(false);
            }}
            className="dropdown-item"
          >
            <Crown size={16} />
            {premiumInfo.active ? 'Премиум активен' : 'Купить премиум'}
          </button>

          <button 
            onClick={() => {
              setShowGiftPremium(!showGiftPremium);
              setShowTransfer(false);
              setShowHistory(false);
              setShowPremium(false);
              setShowDropdown(false);
            }}
            className="dropdown-item"
          >
            <Gift size={16} />
            Подарить премиум
          </button>
        </div>
      )}
    </div>
  );
};

export default Points; 