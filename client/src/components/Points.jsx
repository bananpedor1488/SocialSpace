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
  const [transferSuggestions, setTransferSuggestions] = useState([]);
  const [showTransferSuggestions, setShowTransferSuggestions] = useState(false);
  const [giftSuggestions, setGiftSuggestions] = useState([]);
  const [showGiftSuggestions, setShowGiftSuggestions] = useState(false);
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
      const response = await axios.get('https://server-pqqy.onrender.com/api/points/balance');
      setBalance(response.data.points);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };



  // Загрузить рейтинг
  const loadLeaderboard = async () => {
    try {
      const response = await axios.get('https://server-pqqy.onrender.com/api/points/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Загрузить информацию о премиуме
  const loadPremiumInfo = async () => {
    try {
      const response = await axios.get('https://server-pqqy.onrender.com/api/points/premium-info');
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
      const response = await axios.post('https://server-pqqy.onrender.com/api/points/buy-premium');
      
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
      const response = await axios.post('https://server-pqqy.onrender.com/api/points/gift-premium', giftData);
      
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
      const response = await axios.post('https://server-pqqy.onrender.com/api/points/transfer', {
        ...transferData,
        recipientUsername: (transferData.recipientUsername || '').replace(/^@/, '')
      });
      
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

      {/* Модалка перевода из хедера (через контекст showTransfer) */}
      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal-content transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Перевод баллов</h3>
              <button onClick={() => setShowTransfer(false)} className="close-btn">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTransfer}>
              <div className="form-group transfer-search-wrapper">
                <label>Получатель (username):</label>
                <input
                  type="text"
                  value={transferData.recipientUsername}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTransferData(prev => ({ ...prev, recipientUsername: v }));
                    const q = v.replace(/^@/, '');
                    if (!q || q.length < 2) { setTransferSuggestions([]); setShowTransferSuggestions(false); return; }
                    // легкий дебаунс через setTimeout вне области — упрощенно опускаем
                    axios.get(`https://server-pqqy.onrender.com/api/users/search?query=${encodeURIComponent(q)}`)
                      .then(res => { setTransferSuggestions(res.data || []); setShowTransferSuggestions(true); })
                      .catch(() => { setTransferSuggestions([]); setShowTransferSuggestions(false); });
                  }}
                  placeholder="@username"
                  className="form-input"
                  onFocus={() => { if (transferSuggestions.length) setShowTransferSuggestions(true); }}
                />
                {showTransferSuggestions && transferSuggestions.length > 0 && (
                  <div className="transfer-search-results" onMouseDown={(e) => e.preventDefault()}>
                    {transferSuggestions.slice(0, 5).map(user => (
                      <div
                        key={user._id}
                        className="transfer-search-result"
                        onClick={() => {
                          setTransferData(prev => ({ ...prev, recipientUsername: `@${user.username}` }));
                          setShowTransferSuggestions(false);
                        }}
                      >
                        <Avatar src={user.avatar || null} alt={user.displayName || user.username} size="small" />
                        <div className="search-result-info">
                          <span className="header-search-username">@{user.username}</span>
                          {user.displayName && (
                            <span className="header-search-name">{user.displayName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Сумма:</label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) => setTransferData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Введите сумму"
                  min="1"
                  max={balance}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Описание (необязательно):</label>
                <input
                  type="text"
                  value={transferData.description}
                  onChange={(e) => setTransferData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Описание перевода"
                  className="form-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Выполняется...' : 'Перевести'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Points; 