import React, { createContext, useContext, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../stores/authStore';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const webSocket = useWebSocket();
  const { user, token } = useAuthStore();

  // Manage WebSocket connection at the provider level
  useEffect(() => {
    if (token && user) {
      // Connection is already managed by useWebSocket hook
      console.log('WebSocketProvider: User authenticated, WebSocket will connect');
    }
    
    // Don't disconnect on unmount - let the WebSocket persist
    // The connection will be closed when the user logs out or the app closes
  }, [token, user]);

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};