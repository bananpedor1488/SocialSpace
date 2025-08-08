import React, { useState, useEffect } from 'react';
import { Coins, Send, History, Trophy, X, ChevronDown, ChevronUp, Crown, Gift } from 'lucide-react';
import axios from 'axios';
import Avatar from './Avatar';
import { usePoints } from '../context/PointsContext';

const PointsModals = () => {
  const [balance, setBalance] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
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
  const [giftData, setGiftData] = useState({ recipientUsername: '' });
  const [giftSuggestions, setGiftSuggestions] = useState([]);
  const [giftSearchLoading, setGiftSearchLoading] = useState(false);
  const [showGiftSuggestions, setShowGiftSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { 
    showTransfer, setShowTransfer,
    showHistory, setShowHistory,
    showPremium, setShowPremium,
    showGiftPremium, setShowGiftPremium,
    // Добавляем состояния и функции транзакций из контекста
    transactions,
    selectedTransaction,
    setSelectedTransaction,
    showTransactionDetails,
    setShowTransactionDetails,
    loading,
    setLoading,
    handleTransactionClick
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
    
    if (!giftData.recipientUsername.trim()) {
      setError('Введите username получателя');
      return;
    }
    
    if (balance < 300) {
      setError('Недостаточно баллов для подарка премиума');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.post('https://server-pqqy.onrender.com/api/points/gift-premium', {
        recipientUsername: giftData.recipientUsername
      });
      
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

  // Поиск получателя для подарка (подсказки, поддержка @ и без @)
  useEffect(() => {
    const raw = giftData.recipientUsername.trim();
    const query = raw.replace(/^@/, '');
    if (!query || query.length < 2) {
      setGiftSuggestions([]);
      setShowGiftSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setGiftSearchLoading(true);
        const res = await axios.get(`https://server-pqqy.onrender.com/api/users/search?query=${encodeURIComponent(query)}`);
        setGiftSuggestions(res.data || []);
        setShowGiftSuggestions(true);
      } catch (err) {
        setGiftSuggestions([]);
        setShowGiftSuggestions(false);
      } finally {
        setGiftSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [giftData.recipientUsername]);

  // Перевести баллы
  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!transferData.recipientUsername.trim()) {
      setError('Введите username получателя');
      return;
    }
    
    if (!transferData.amount || transferData.amount <= 0) {
      setError('Введите корректную сумму');
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
        recipientUsername: transferData.recipientUsername,
        amount: transferData.amount,
        description: transferData.description
      });
      
      setSuccess('Перевод выполнен успешно!');
      setBalance(response.data.newBalance);
      setTransferData({ recipientUsername: '', amount: '', description: '' });
      setShowTransfer(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка перевода');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString('ru-RU');
  };





  useEffect(() => {
    loadBalance();
    loadPremiumInfo();
  }, []);

  return (
    <>
      {/* Форма перевода */}
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
        </div>
      )}

      {/* История транзакций */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>История транзакций</h3>
              <button onClick={() => setShowHistory(false)} className="close-btn">
                <X size={16} />
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : Array.isArray(transactions) && transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.map(transaction => (
                  <div 
                    key={transaction._id} 
                    className="transaction-item clickable"
                    onClick={() => handleTransactionClick(transaction)}
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
        </div>
      )}

      {/* Премиум форма */}
      {showPremium && (
        <div className="modal-overlay" onClick={() => setShowPremium(false)}>
          <div className="modal-content premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🌟 Премиум подписка</h3>
              <button onClick={() => setShowPremium(false)} className="close-btn">
                <X size={16} />
              </button>
            </div>
            
            {premiumInfo.active ? (
              <div className="premium-active">
                <div className="premium-status">
                  <Crown size={32} className="premium-icon" />
                  <h5>🎉 Премиум активен!</h5>
                  <p className="premium-expires">Действует до: {premiumInfo.expiresAt ? new Date(premiumInfo.expiresAt).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
                  
                  <div className="premium-benefits">
                    <h6>✨ Ваши премиум возможности:</h6>
                    <ul>
                      <li>🌟 Золотая корона в профиле</li>
                      <li>💎 Приоритет в поиске</li>
                      <li>🎨 Специальные анимации</li>
                      <li>📈 Расширенная статистика</li>
                      <li>🎁 Возможность дарить премиум</li>
                      <li>✅ Комиссия на переводы: 0%</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="premium-buy">
                <div className="premium-info">
                  <Crown size={48} className="premium-icon" />
                  <h5>💎 Купить премиум</h5>
                  
                  <div className="premium-details">
                    <div className="premium-cost">
                      <span className="cost-label">Стоимость:</span>
                      <span className="cost-amount">300 баллов</span>
                    </div>
                    <div className="premium-duration">
                      <span className="duration-label">Длительность:</span>
                      <span className="duration-amount">30 дней</span>
                    </div>
                    <div className="premium-balance">
                      <span className="balance-label">Ваш баланс:</span>
                      <span className="balance-amount">{formatAmount(balance)} баллов</span>
                    </div>
                  </div>

                  <div className="premium-benefits">
                    <h6>🎁 Что включено в премиум:</h6>
                    <ul>
                      <li>🌟 Золотая корона в профиле</li>
                      <li>💎 Приоритет в поиске пользователей</li>
                      <li>🎨 Специальные анимации и эффекты</li>
                      <li>📈 Расширенная статистика профиля</li>
                      <li>🎁 Возможность дарить премиум друзьям</li>
                      <li>✅ Комиссия на переводы: 0%</li>
                      <li>⚡ Приоритетная поддержка</li>
                      <li>🎯 Эксклюзивные функции</li>
                    </ul>
                  </div>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <button 
                  onClick={handleBuyPremium}
                  disabled={loading || balance < 300}
                  className="buy-premium-btn"
                >
                  {loading ? '🔄 Покупка...' : balance < 300 ? '❌ Недостаточно баллов' : '💎 Купить премиум'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Форма дарения премиума */}
      {showGiftPremium && (
        <div className="modal-overlay" onClick={() => setShowGiftPremium(false)}>
          <div className="modal-content gift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎁 Подарить премиум</h3>
              <button onClick={() => setShowGiftPremium(false)} className="close-btn">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleGiftPremium}>
              <div className="form-group">
                <label>👤 Получатель (username):</label>
                <input
                  type="text"
                  value={giftData.recipientUsername}
                  onChange={(e) => setGiftData(prev => ({ ...prev, recipientUsername: e.target.value }))}
                  placeholder="@username"
                  className="form-input"
                  onFocus={() => { if (giftSuggestions.length) setShowGiftSuggestions(true); }}
                />
                {showGiftSuggestions && giftSuggestions.length > 0 && (
                  <div className="transfer-search-results" onMouseDown={(e) => e.preventDefault()}>
                    {giftSuggestions.slice(0, 5).map(user => (
                      <div
                        key={user._id}
                        className="transfer-search-result"
                        onClick={() => {
                          setGiftData({ recipientUsername: `@${user.username}` });
                          setShowGiftSuggestions(false);
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
              
              <div className="gift-info">
                <Gift size={24} className="gift-icon" />
                <div className="gift-details">
                  <div className="gift-cost">
                    <span className="cost-label">Стоимость подарка:</span>
                    <span className="cost-amount">300 баллов</span>
                  </div>
                  <div className="gift-duration">
                    <span className="duration-label">Длительность:</span>
                    <span className="duration-amount">30 дней</span>
                  </div>
                  <div className="gift-balance">
                    <span className="balance-label">Ваш баланс:</span>
                    <span className="balance-amount">{formatAmount(balance)} баллов</span>
                  </div>
                </div>
                
                <div className="gift-benefits">
                  <h6>🎁 Что получит пользователь:</h6>
                  <ul>
                    <li>🌟 Золотая корона в профиле</li>
                    <li>💎 Приоритет в поиске</li>
                    <li>🎨 Специальные анимации</li>
                    <li>📈 Расширенная статистика</li>
                    <li>🎁 Возможность дарить премиум</li>
                  </ul>
                </div>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <button 
                type="submit" 
                disabled={loading || balance < 300}
                className="submit-btn"
              >
                {loading ? '🔄 Дарение...' : balance < 300 ? '❌ Недостаточно баллов' : '🎁 Подарить премиум'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Детали транзакции */}
      {showTransactionDetails && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowTransactionDetails(false)}>
          <div className="modal-content transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Детали транзакции</h3>
              <button onClick={() => setShowTransactionDetails(false)} className="close-btn">
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
        </div>
      )}
    </>
  );
};

export default PointsModals; 