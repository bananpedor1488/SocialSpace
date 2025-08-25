import React, { useState, useEffect } from 'react';

const TokenDebug = () => {
  const [tokens, setTokens] = useState({});

  useEffect(() => {
    const checkTokens = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');
      const oldToken = localStorage.getItem('token');

      setTokens({
        accessToken: {
          exists: !!accessToken,
          length: accessToken ? accessToken.length : 0,
          value: accessToken ? accessToken.substring(0, 20) + '...' : null
        },
        refreshToken: {
          exists: !!refreshToken,
          length: refreshToken ? refreshToken.length : 0,
          value: refreshToken ? refreshToken.substring(0, 20) + '...' : null
        },
        user: {
          exists: !!user,
          value: user ? JSON.parse(user).username : null
        },
        oldToken: {
          exists: !!oldToken,
          length: oldToken ? oldToken.length : 0,
          value: oldToken ? oldToken.substring(0, 20) + '...' : null
        }
      });
    };

    checkTokens();
    const interval = setInterval(checkTokens, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearAllTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#333',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>🔍 Token Debug</h4>
      <div>
        <strong>accessToken:</strong> {tokens.accessToken?.exists ? '✅' : '❌'} 
        ({tokens.accessToken?.length || 0} chars)
      </div>
      <div>
        <strong>refreshToken:</strong> {tokens.refreshToken?.exists ? '✅' : '❌'} 
        ({tokens.refreshToken?.length || 0} chars)
      </div>
      <div>
        <strong>user:</strong> {tokens.user?.exists ? '✅' : '❌'} 
        {tokens.user?.value && ` (${tokens.user.value})`}
      </div>
      <div>
        <strong>oldToken:</strong> {tokens.oldToken?.exists ? '✅' : '❌'} 
        ({tokens.oldToken?.length || 0} chars)
      </div>
      <button 
        onClick={clearAllTokens}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          background: '#ff4444',
          color: '#fff',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Clear All Tokens
      </button>
    </div>
  );
};

export default TokenDebug;
