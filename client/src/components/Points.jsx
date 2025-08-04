import React, { useState, useEffect } from 'react';
import { Coins, Send, History, Trophy, X, ChevronDown, ChevronUp, Crown, Gift } from 'lucide-react';
import axios from 'axios';
import Avatar from './Avatar';

const Points = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showGiftPremium, setShowGiftPremium] = useState(false);
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
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

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

  // Загрузить детали транзакции
  const loadTransactionDetails = async (transactionCode) => {
    try {
      const response = await axios.get(`https://server-u9ji.onrender.com/api/points/transaction/${transactionCode}`);
      setSelectedTransaction(response.data.transaction);
      setShowTransactionDetails(true);
    } catch (error) {
      console.error('Error loading transaction details:', error);
      setError('Ошибка загрузки деталей транзакции');
    }
  };

  // Обработчик клика по транзакции
  const handleTransactionClick = (transaction) => {
    loadTransactionDetails(transaction.transactionCode);
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
        <div className="points-dropdown">
          <button 
            onClick={() => {
              setShowTransfer(!showTransfer);
              setShowHistory(false);
              setShowPremium(false);
              setShowGiftPremium(false);
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
              setShowPremium(false);
              setShowGiftPremium(false);
              if (!showHistory) loadTransactions();
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
            }}
            className="dropdown-item"
          >
            <Gift size={16} />
            Подарить премиум
          </button>

          {/* Форма перевода внутри выпадающего меню */}
          {showTransfer && (
            <div className="dropdown-form">
              <div className="form-header">
                <h4>Перевод баллов</h4>
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

          {/* История транзакций внутри выпадающего меню */}
          {showHistory && (
            <div className="dropdown-form">
              <div className="form-header">
                <h4>История транзакций</h4>
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
                    <div 
                      key={transaction._id} 
                      className="transaction-item clickable"
                      onClick={() => handleTransactionClick(transaction)}
                      style={{ cursor: 'pointer' }}
                    >
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

          {/* Премиум форма внутри выпадающего меню */}
          {showPremium && (
            <div className="dropdown-form">
              <div className="form-header">
                <h4>Премиум</h4>
                <button 
                  onClick={() => setShowPremium(false)}
                  className="close-btn"
                >
                  <X size={16} />
                </button>
              </div>
              
              {premiumInfo.active ? (
                <div className="premium-active">
                  <div className="premium-status">
                    <Crown size={24} className="premium-icon" />
                    <h5>Премиум активен</h5>
                    <p>Действует до: {premiumInfo.expiresAt ? new Date(premiumInfo.expiresAt).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
                  </div>
                </div>
              ) : (
                <div className="premium-buy">
                  <div className="premium-info">
                    <Crown size={32} className="premium-icon" />
                    <h5>Купить премиум</h5>
                    <p>Стоимость: 300 баллов</p>
                    <p>Длительность: 30 дней</p>
                    <p>Ваш баланс: {formatAmount(balance)} баллов</p>
                  </div>
                  
                  {error && <div className="error-message">{error}</div>}
                  {success && <div className="success-message">{success}</div>}
                  
                  <button 
                    onClick={handleBuyPremium}
                    disabled={loading || balance < 300}
                    className="buy-premium-btn"
                  >
                    {loading ? 'Покупка...' : 'Купить премиум'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Форма дарения премиума внутри выпадающего меню */}
          {showGiftPremium && (
            <div className="dropdown-form">
              <div className="form-header">
                <h4>Подарить премиум</h4>
                <button 
                  onClick={() => setShowGiftPremium(false)}
                  className="close-btn"
                >
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleGiftPremium}>
                <div className="form-group">
                  <label>Получатель (username):</label>
                  <input
                    type="text"
                    value={giftData.recipientUsername}
                    onChange={(e) => setGiftData(prev => ({ ...prev, recipientUsername: e.target.value }))}
                    placeholder="@username"
                    className="form-input"
                  />
                </div>
                
                <div className="gift-info">
                  <Gift size={20} className="gift-icon" />
                  <p>Стоимость подарка: 300 баллов</p>
                  <p>Ваш баланс: {formatAmount(balance)} баллов</p>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <button 
                  type="submit" 
                  disabled={loading || balance < 300}
                  className="submit-btn"
                >
                  {loading ? 'Дарение...' : 'Подарить премиум'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}



      {/* Детали транзакции */}
      {showTransactionDetails && selectedTransaction && (
        <div className="transaction-details-modal">
          <div className="transaction-details-header">
            <h3>Детали транзакции</h3>
            <button 
              onClick={() => {
                setShowTransactionDetails(false);
                setSelectedTransaction(null);
              }}
              className="close-btn"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="transaction-details-content">
            <div className="transaction-detail-row">
              <span className="detail-label">Код транзакции:</span>
              <span className="detail-value">{selectedTransaction.transactionCode}</span>
            </div>
            
            <div className="transaction-detail-row">
              <span className="detail-label">Тип:</span>
              <span className="detail-value">
                {selectedTransaction.type === 'transfer' && 'Перевод'}
                {selectedTransaction.type === 'premium' && 'Покупка премиума'}
                {selectedTransaction.type === 'premium_gift' && 'Подарок премиума'}
                {selectedTransaction.type === 'reward' && 'Награда'}
                {selectedTransaction.type === 'bonus' && 'Бонус'}
                {selectedTransaction.type === 'system' && 'Системная'}
              </span>
            </div>
            
            <div className="transaction-detail-row">
              <span className="detail-label">Сумма:</span>
              <span className={`detail-value ${selectedTransaction.isOutgoing ? 'outgoing' : 'incoming'}`}>
                {selectedTransaction.isOutgoing ? '-' : '+'}{formatAmount(selectedTransaction.amount)} баллов
              </span>
            </div>
            
            <div className="transaction-detail-row">
              <span className="detail-label">Описание:</span>
              <span className="detail-value">{selectedTransaction.description || 'Нет описания'}</span>
            </div>
            
            <div className="transaction-detail-row">
              <span className="detail-label">Статус:</span>
              <span className={`detail-value status-${selectedTransaction.status}`}>
                {selectedTransaction.status === 'completed' && '✅ Выполнено'}
                {selectedTransaction.status === 'pending' && '⏳ В обработке'}
                {selectedTransaction.status === 'failed' && '❌ Ошибка'}
                {selectedTransaction.status === 'cancelled' && '🚫 Отменено'}
              </span>
            </div>
            
            <div className="transaction-detail-row">
              <span className="detail-label">Дата:</span>
              <span className="detail-value">{formatDate(selectedTransaction.createdAt)}</span>
            </div>
            
            {selectedTransaction.sender && (
              <div className="transaction-detail-row">
                <span className="detail-label">Отправитель:</span>
                <div className="detail-user">
                  <Avatar 
                    src={selectedTransaction.sender.avatar}
                    alt={selectedTransaction.sender.displayName}
                    size="small"
                  />
                  <span>{selectedTransaction.sender.displayName}</span>
                </div>
              </div>
            )}
            
            {selectedTransaction.recipient && (
              <div className="transaction-detail-row">
                <span className="detail-label">Получатель:</span>
                <div className="detail-user">
                  <Avatar 
                    src={selectedTransaction.recipient.avatar}
                    alt={selectedTransaction.recipient.displayName}
                    size="small"
                  />
                  <span>{selectedTransaction.recipient.displayName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Points; 