import React, { useState, useEffect } from 'react';
import { Coins, Send, History, Trophy, X, ChevronDown, ChevronUp, Crown, Gift } from 'lucide-react';
import axios from 'axios';
import Avatar from './Avatar';
import OnlineStatus from './OnlineStatus';
import { usePoints } from '../context/PointsContext';
import { formatDate, formatDateTime } from '../utils/timeUtils';

const PointsModals = () => {
  const [balance, setBalance] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [premiumInfo, setPremiumInfo] = useState({
    active: false,
    expiresAt: null,
    premiumCost: 300
  });
  const [giftData, setGiftData] = useState({ recipientUsername: '' });
  const [giftSuggestions, setGiftSuggestions] = useState([]);
  const [giftSearchLoading, setGiftSearchLoading] = useState(false);
  const [showGiftSuggestions, setShowGiftSuggestions] = useState(false);
  const [foundGiftUser, setFoundGiftUser] = useState(null);
  const [foundGiftUserStatus, setFoundGiftUserStatus] = useState(null);
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
      setFoundGiftUser(null);
      setFoundGiftUserStatus(null);
      
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
      setFoundGiftUser(null);
      setFoundGiftUserStatus(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        setGiftSearchLoading(true);
        const res = await axios.get(`https://server-pqqy.onrender.com/api/users/search?query=${encodeURIComponent(query)}`);
        const suggestions = res.data || [];
        setGiftSuggestions(suggestions);
        
        // Если введен точный username с @ и он совпадает с одним из результатов, не показываем подсказки
        if (raw.startsWith('@') && query.length >= 2) {
          const exactMatch = suggestions.find(user => 
            user.username.toLowerCase() === query.toLowerCase()
          );
          if (exactMatch) {
            setShowGiftSuggestions(false);
            setFoundGiftUser(exactMatch);
            // Получаем статус пользователя
            try {
              const statusRes = await axios.get(`https://server-pqqy.onrender.com/api/users/online-status?userIds=${exactMatch._id}`);
              if (statusRes.data && statusRes.data[exactMatch._id]) {
                setFoundGiftUserStatus(statusRes.data[exactMatch._id]);
              }
            } catch (statusError) {
              console.error('Error fetching user status:', statusError);
            }
            return;
          }
        }
        
        setFoundGiftUser(null);
        setFoundGiftUserStatus(null);
        setShowGiftSuggestions(true);
      } catch (err) {
        setGiftSuggestions([]);
        setShowGiftSuggestions(false);
        setFoundGiftUser(null);
        setFoundGiftUserStatus(null);
      } finally {
        setGiftSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [giftData.recipientUsername]);

  const formatAmount = (amount) => {
    return amount.toLocaleString('ru-RU');
  };

  useEffect(() => {
    loadBalance();
    loadPremiumInfo();
  }, []);

  return (
    <>
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
                        {formatDateTime(transaction.createdAt)}
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
                  <p className="premium-expires">Действует до: {premiumInfo.expiresAt ? formatDate(premiumInfo.expiresAt) : 'Неизвестно'}</p>
                  
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
        <div className="modal-overlay" onClick={() => {
          setShowGiftPremium(false);
          setFoundGiftUser(null);
          setFoundGiftUserStatus(null);
        }}>
          <div className="modal-content gift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎁 Подарить премиум</h3>
              <button onClick={() => {
                setShowGiftPremium(false);
                setFoundGiftUser(null);
                setFoundGiftUserStatus(null);
              }} className="close-btn">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleGiftPremium}>
              <div className="form-group">
                <label>👤 Получатель (username):</label>
                <input
                  type="text"
                  value={giftData.recipientUsername}
                  onChange={(e) => {
                    setGiftData(prev => ({ ...prev, recipientUsername: e.target.value }));
                    // Сбрасываем найденного пользователя при изменении
                    if (!e.target.value.trim()) {
                      setFoundGiftUser(null);
                      setFoundGiftUserStatus(null);
                    }
                  }}
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
              
              {/* Плашка с информацией о найденном пользователе */}
              {foundGiftUser && (
                <div className="found-user-card">
                  <div className="found-user-header">
                    <div className="found-user-check">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                    <span className="found-user-title">Пользователь найден</span>
                  </div>
                  <div className="found-user-content">
                    <div className="found-user-avatar">
                      <Avatar 
                        src={foundGiftUser.avatar || null}
                        alt={foundGiftUser.displayName || foundGiftUser.username}
                        size="medium"
                      />
                      {foundGiftUserStatus && (
                        <div className="found-user-status">
                          <OnlineStatus
                            userId={foundGiftUser._id}
                            isOnline={foundGiftUserStatus.isOnline}
                            lastSeen={foundGiftUserStatus.lastSeen}
                            size="small"
                          />
                        </div>
                      )}
                    </div>
                    <div className="found-user-info">
                      <div className="found-user-name">
                        {foundGiftUser.displayName || foundGiftUser.username}
                        {foundGiftUser.premium && (
                          <span className="found-user-premium">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="found-user-username">@{foundGiftUser.username}</div>
                      {foundGiftUserStatus && !foundGiftUserStatus.isOnline && foundGiftUserStatus.lastSeen && (
                        <div className="found-user-last-seen">
                          Был в сети {formatDateTime(foundGiftUserStatus.lastSeen, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
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
                <span className="detail-value">{formatDateTime(selectedTransaction.createdAt)}</span>
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