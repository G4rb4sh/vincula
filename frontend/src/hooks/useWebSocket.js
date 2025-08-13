import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const WS_URL = process.env.REACT_APP_WS_URL || '';
const RECONNECT_INTERVAL = 5000; // Increased from 3 seconds to 5 seconds
const MAX_RECONNECT_ATTEMPTS = 3; // Reduced from 5 to 3 attempts

export const useWebSocket = () => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const eventListenersRef = useRef({});
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { token, user } = useAuthStore();

  // Conectar al WebSocket
  const connect = useCallback(() => {
    if (!token || !user) {
      console.log('No token or user available for WebSocket connection');
      return;
    }

    // Evitar múltiples conexiones simultáneas
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection already in progress');
      return;
    }

    // Reusar conexión existente si ya está abierta
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already open, reusing existing connection');
      setIsConnected(true);
      setReconnectAttempts(0);
      return;
    }

    try {
      // Construir URL con token de autenticación usando base relativo si no hay env
      const base = WS_URL || (window.location.protocol.replace('http', 'ws') + '//' + window.location.host);
      const wsUrl = `${base}/ws?token=${encodeURIComponent(token)}&user_id=${user.id}&role=${user.role}`;
      
      console.log('Connecting to WebSocket...');
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Enviar mensaje de autenticación después de que el WebSocket esté conectado
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const authMessage = {
            type: 'auth',
            data: {
              user_id: user.id,
              role: user.role,
              token: token
            },
            timestamp: new Date().toISOString(),
            user_id: user.id
          };
          
          try {
            wsRef.current.send(JSON.stringify(authMessage));
            console.log('WebSocket auth message sent:', authMessage);
          } catch (error) {
            console.error('Error sending WebSocket auth message:', error);
          }
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Llamar a los listeners registrados para este tipo de evento
          const listeners = eventListenersRef.current[data.type] || [];
          listeners.forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error('Error in WebSocket listener:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Intentar reconectar si no fue un cierre intencional y no hemos excedido los intentos
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Attempting to reconnect... (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, RECONNECT_INTERVAL);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.log('Max reconnection attempts reached. Stopping reconnection.');
          setReconnectAttempts(0);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [token, user, reconnectAttempts]);

  // Desconectar WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  // Enviar mensaje
  const send = useCallback((type, data = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString(),
        user_id: user?.id
      };
      
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('WebSocket message sent:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', { type, data });
    }
  }, [user]);

  // Registrar listener para eventos
  const on = useCallback((eventType, listener) => {
    if (!eventListenersRef.current[eventType]) {
      eventListenersRef.current[eventType] = [];
    }
    eventListenersRef.current[eventType].push(listener);
    
    console.log(`Registered listener for event: ${eventType}`);
  }, []);

  // Desregistrar listener
  const off = useCallback((eventType, listener) => {
    if (eventListenersRef.current[eventType]) {
      eventListenersRef.current[eventType] = eventListenersRef.current[eventType].filter(
        l => l !== listener
      );
    }
  }, []);

  // Limpiar todos los listeners de un tipo de evento
  const removeAllListeners = useCallback((eventType) => {
    if (eventType) {
      eventListenersRef.current[eventType] = [];
    } else {
      eventListenersRef.current = {};
    }
  }, []);

  // Conectar automáticamente cuando hay token y usuario
  useEffect(() => {
    if (token && user) {
      connect();
    }

    // Don't disconnect on unmount - WebSocket should persist across navigation
    // Only disconnect when token/user changes (logout)
    return () => {
      // Only disconnect if there's no token (user logged out)
      if (!token) {
        disconnect();
      }
    };
  }, [token, user, connect, disconnect]);

  return {
    isConnected,
    send,
    on,
    off,
    removeAllListeners,
    connect,
    disconnect,
    reconnectAttempts
  };
};

// Hook especializado para actualizaciones de cola
export const useQueueUpdates = () => {
  const webSocket = useWebSocket();
  const [queueData, setQueueData] = useState([]);
  const [activeCallsData, setActiveCallsData] = useState([]);

  useEffect(() => {
    const handleQueueUpdate = (data) => {
      if (data.data?.queue) {
        setQueueData(data.data.queue);
      }
    };

    const handleActiveCallsUpdate = (data) => {
      if (data.data?.active_calls) {
        setActiveCallsData(data.data.active_calls);
      }
    };

    const handleCallStatusUpdate = (data) => {
      console.log('Call status update:', data);
      // Aquí podrías manejar actualizaciones específicas de estado de llamadas
    };

    // Registrar listeners
    webSocket.on('queue_update', handleQueueUpdate);
    webSocket.on('active_calls_update', handleActiveCallsUpdate);
    webSocket.on('call_status_update', handleCallStatusUpdate);

    // Solicitar datos iniciales cuando se conecta
    if (webSocket.isConnected) {
      webSocket.send('get_queue_status');
      webSocket.send('get_active_calls');
    }

    return () => {
      webSocket.off('queue_update', handleQueueUpdate);
      webSocket.off('active_calls_update', handleActiveCallsUpdate);
      webSocket.off('call_status_update', handleCallStatusUpdate);
    };
  }, [webSocket]);

  return {
    queueData,
    activeCallsData,
    isConnected: webSocket.isConnected,
    requestQueueUpdate: () => webSocket.send('get_queue_status'),
    requestActiveCallsUpdate: () => webSocket.send('get_active_calls')
  };
};

// Hook para notificaciones en tiempo real
export const useNotifications = () => {
  const webSocket = useWebSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (data) => {
      const notification = {
        id: Date.now(),
        ...data.data,
        timestamp: new Date()
      };
      
      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Mantener solo las últimas 10
      
      // Auto-remover después de cierto tiempo si es una notificación temporal
      if (notification.auto_dismiss !== false) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.duration || 5000);
      }
    };

    webSocket.on('notification', handleNotification);
    webSocket.on('alert', handleNotification);
    webSocket.on('system_message', handleNotification);

    return () => {
      webSocket.off('notification', handleNotification);
      webSocket.off('alert', handleNotification);
      webSocket.off('system_message', handleNotification);
    };
  }, [webSocket]);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAllNotifications,
    isConnected: webSocket.isConnected
  };
};

// Hook para actualizaciones específicas de familiares (observadores)
export const useFamilyObserver = () => {
  const webSocket = useWebSocket();
  const [observerData, setObserverData] = useState({
    canObserve: false,
    activeCall: null,
    patientInfo: null
  });

  useEffect(() => {
    const handleObserverUpdate = (data) => {
      setObserverData(prev => ({
        ...prev,
        ...data.data
      }));
    };

    const handleCallEnd = (data) => {
      if (data.data?.call_id === observerData.activeCall?.id) {
        setObserverData(prev => ({
          ...prev,
          canObserve: false,
          activeCall: null
        }));
      }
    };

    webSocket.on('observer_access_update', handleObserverUpdate);
    webSocket.on('call_ended', handleCallEnd);

    // Solicitar estado inicial
    if (webSocket.isConnected) {
      webSocket.send('get_observer_status');
    }

    return () => {
      webSocket.off('observer_access_update', handleObserverUpdate);
      webSocket.off('call_ended', handleCallEnd);
    };
  }, [webSocket, observerData.activeCall?.id]);

  return {
    ...observerData,
    isConnected: webSocket.isConnected,
    requestUpdate: () => webSocket.send('get_observer_status')
  };
};

// Hook para manejar redirecciones automáticas de llamadas
export const useCallRedirection = () => {
  const webSocket = useWebSocket();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    console.log('🔗 useCallRedirection: Configurando listeners para usuario:', user?.role, user?.id);
    
    const handleCallStarted = (data) => {
      console.log('📞 Call started notification received:', data);
      
      // Solo redirigir pacientes automáticamente
      if (user?.role === 'patient') {
        const callId = data.call_id;
        if (callId) {
          if (hasRedirectedRef.current) {
            return;
          }
          hasRedirectedRef.current = true;
          console.log(`🎥 Redirecting patient to video call: ${callId}`);
          // Pequeño delay para asegurar que el token/estado esté listo
          setTimeout(() => {
            console.log(`🚀 Navegando a /video-call/${callId}`);
            navigate(`/video-call/${callId}`);
          }, 1200);
        } else {
          console.warn('⚠️ Call started notification missing call_id:', data);
        }
      } else {
        console.log('ℹ️ Call started notification for non-patient user, not redirecting');
      }
    };

    const handleDirectMessage = (data) => {
      console.log('📨 Direct message received:', data);
      // Manejar mensajes directos que pueden contener redirecciones
      if (data.data && data.data.type === 'call_started') {
        console.log('🔄 Processing call_started from direct message');
        handleCallStarted(data.data);
      }
    };

    webSocket.on('call_started', handleCallStarted);
    webSocket.on('direct', handleDirectMessage);

    return () => {
      console.log('🧹 useCallRedirection: Limpiando listeners');
      webSocket.off('call_started', handleCallStarted);
      webSocket.off('direct', handleDirectMessage);
      hasRedirectedRef.current = false;
    };
  }, [webSocket, navigate, user]);

  return {
    isConnected: webSocket.isConnected
  };
};