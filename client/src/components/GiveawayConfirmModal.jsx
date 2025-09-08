import React, { useEffect, useState } from 'react';
import { X, Gift, Coins, Crown, AlertTriangle } from 'lucide-react';
import './GiveawayConfirmModal.css';

const GiveawayConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  giveawayType, 
  prizeAmount, 
  prizeDescription,
  cost = 0,
  userPoints = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      // Блокируем скролл страницы
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (giveawayType) {
      case 'points':
        return <Coins size={48} className="modal-icon points-icon" />;
      case 'premium':
        return <Crown size={48} className="modal-icon premium-icon" />;
      default:
        return <Gift size={48} className="modal-icon gift-icon" />;
    }
  };

  const getTitle = () => {
    switch (giveawayType) {
      case 'points':
        return 'Розыгрыш баллов';
      case 'premium':
        return 'Розыгрыш премиума';
      default:
        return 'Создать розыгрыш';
    }
  };

  const getPrizeText = () => {
    switch (giveawayType) {
      case 'points':
        return `${prizeAmount} баллов`;
      case 'premium':
        return `${prizeAmount} дней премиума`;
      default:
        return prizeDescription || 'Приз';
    }
  };

  const canAfford = userPoints >= cost;

  if (!isVisible) return null;

  return (
    <div 
      className={`modal-backdrop ${isAnimating ? 'visible' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`modal-content ${isAnimating ? 'visible' : ''}`}>
        <div className="modal-header">
          <div className="modal-icon-container">
            {getIcon()}
          </div>
          <h2 className="modal-title">{getTitle()}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="prize-info">
            <div className="prize-label">Приз:</div>
            <div className="prize-value">{getPrizeText()}</div>
          </div>

          {cost > 0 && (
            <div className="cost-info">
              <div className="cost-label">Стоимость:</div>
              <div className={`cost-value ${!canAfford ? 'insufficient' : ''}`}>
                {cost} баллов
              </div>
            </div>
          )}

          {cost > 0 && (
            <div className="balance-info">
              <div className="balance-label">Ваш баланс:</div>
              <div className={`balance-value ${!canAfford ? 'insufficient' : ''}`}>
                {userPoints} баллов
              </div>
            </div>
          )}

          {!canAfford && cost > 0 && (
            <div className="insufficient-funds">
              <AlertTriangle size={20} />
              <span>Недостаточно баллов для создания розыгрыша</span>
            </div>
          )}

          <div className="confirmation-text">
            Вы уверены, что хотите создать этот розыгрыш?
            {cost > 0 && canAfford && (
              <span className="cost-warning">
                <br />С вашего счета будет списано {cost} баллов.
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="modal-btn cancel-btn" 
            onClick={onClose}
          >
            Отмена
          </button>
          <button 
            className={`modal-btn confirm-btn ${!canAfford ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!canAfford}
          >
            Создать розыгрыш
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiveawayConfirmModal;
