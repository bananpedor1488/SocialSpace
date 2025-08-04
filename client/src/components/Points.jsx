import React, { useState, useEffect } from 'react';
import { Coins, Send, History, Trophy, X, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import Avatar from './Avatar';

const Points = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState({
    recipientUsername: '',
    amount: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Загрузить баланс
  const loadBalance = async () => {
    try {
      const response = await axios.get('https://server-u9ji.onrender.com/api/points/balance');
      setBalance(response.data.points);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  // Загрузить историю транзакций
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://server-u9ji.onrender.com/api/points/transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
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
      
      // Обновить историю
      loadTransactions();
      
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
        <div className="points-dropdown">
          <button 
            onClick={() => {
              setShowTransfer(!showTransfer);
              setShowHistory(false);
            }}
            className="dropdown-item"
          >
            <Send size={16} />
            Перевести баллы
          </button>
          
          <button 
            onClick={() => {
              setShowHistory(!showHistory);
              setShowTransfer(false);
              if (!showHistory) loadTransactions();
            }}
            className="dropdown-item"
          >
            <History size={16} />
            История транзакций
          </button>
        </div>
      )}

      {/* Форма перевода */}
      {showTransfer && (
        <div className="transfer-form">
          <div className="transfer-header">
            <h3>Перевод баллов</h3>
            <button 
              onClick={() => setShowTransfer(false)}
              className="close-btn"
            >
              <X size={16} />
            </button>
          </div>
          
          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label>Получатель (username):</label>
              <input
                type="text"
                value={transferData.recipientUsername}
                onChange={(e) => setTransferData(prev => ({ ...prev, recipientUsername: e.target.value }))}
                placeholder="@username"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Сумма:</label>
              <input
                type="number"
                value={transferData.amount}
                onChange={(e) => setTransferData(prev => ({ ...prev, amount: parseInt(e.target.value) || '' }))}
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
            
            <button 
              type="submit" 
              disabled={loading}
              className="submit-btn"
            >
              {loading ? 'Выполняется...' : 'Перевести'}
            </button>
          </form>
        </div>
      )}

      {/* История транзакций */}
      {showHistory && (
        <div className="transactions-history">
          <div className="history-header">
            <h3>История транзакций</h3>
            <button 
              onClick={() => setShowHistory(false)}
              className="close-btn"
            >
              <X size={16} />
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : transactions.length > 0 ? (
            <div className="transactions-list">
              {transactions.map(transaction => (
                <div key={transaction._id} className="transaction-item">
                  <div className="transaction-avatar">
                    <Avatar 
                      src={transaction.isOutgoing ? transaction.recipient.avatar : transaction.sender.avatar}
                      alt={transaction.isOutgoing ? transaction.recipient.displayName : transaction.sender.displayName}
                      size="small"
                    />
                  </div>
                  
                  <div className="transaction-info">
                    <div className="transaction-user">
                      {transaction.isOutgoing ? transaction.recipient.displayName : transaction.sender.displayName}
                    </div>
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-date">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  
                  <div className={`transaction-amount ${transaction.isOutgoing ? 'outgoing' : 'incoming'}`}>
                    {transaction.isOutgoing ? '-' : '+'}{formatAmount(transaction.amount)}
                  </div>
                  
                  <div className="transaction-code">
                    {transaction.transactionCode}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transactions">История транзакций пуста</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Points; 