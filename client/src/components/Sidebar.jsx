import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  User, 
  Search, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

const Sidebar = ({ currentPage, totalUnread, isConnected, connectionStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: 'home',
      label: 'Главная',  
      icon: Home,
      path: '/home'
    },
    {
      key: 'messages',
      label: 'Сообщения',
      icon: MessageCircle,
      path: '/messages',
      badge: totalUnread > 0 ? totalUnread : null
    },
    {
      key: 'profile',
      label: 'Профиль',
      icon: User,
      path: '/profile'
    },
    {
      key: 'search',
      label: 'Поиск',
      icon: Search,
      path: '/search'
    }
  ];

  const isActivePage = (path) => {
    if (path === '/profile') {
      return location.pathname.startsWith('/profile');
    }
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`nav-item ${isActivePage(item.path) ? 'active' : ''}`}
            >
              <div className="nav-item-content">
                <item.icon size={20} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </div>
            </button>
          ))}
        </nav>
        
        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (
              <Wifi size={16} className="status-icon" />
            ) : (
              <WifiOff size={16} className="status-icon" />
            )}
            <span className="status-text">{connectionStatus}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;