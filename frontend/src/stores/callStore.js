import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { apiRequest } from '../utils/api';

const useCallStore = create((set, get) => ({
  // Estado de la cola
  queueEntries: [],
  queueLoading: false,
  queueError: null,

  // Estado de llamadas activas
  activeCalls: [],
  activeCallsLoading: false,
  currentCall: null,

  // Estado específico para familiares observadores
  observerAccess: {
    canObserve: false,
    activeCall: null,
    patientInfo: null,
  },

  // Estado del paciente en cola
  patientQueueStatus: {
    inQueue: false,
    position: null,
    estimatedWait: null,
    queueId: null,
  },

  // Historial de llamadas
  callHistory: [],
  historyLoading: false,

  // --- ACCIONES PARA LA COLA ---

  // Cargar entradas de la cola
  loadQueue: async () => {
    set({ queueLoading: true, queueError: null });
    
    try {
      const data = await apiRequest('/api/queue/');
      set({ 
        queueEntries: data.queue || [],
        queueLoading: false,
        queueError: null,
      });
    } catch (error) {
      set({ 
        queueLoading: false,
        queueError: error.message,
      });
    }
  },

  // Actualizar cola (usado por WebSocket)
  updateQueue: (queueData) => {
    set({ queueEntries: queueData });
  },

  // Unirse a la cola (para pacientes)
  joinQueue: async (queueData) => {
    try {
      const response = await fetch('/api/queue/join', {
        method: 'POST',
        headers: {
          ...useAuthStore.getState().getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error joining queue');
      }

      const data = await response.json();
      
      set({
        patientQueueStatus: {
          inQueue: true,
          position: data.position,
          estimatedWait: data.estimated_wait,
          queueId: data.queue_id,
        },
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Salir de la cola
  leaveQueue: async () => {
    const { patientQueueStatus } = get();
    
    if (!patientQueueStatus.queueId) {
      return { success: false, error: 'Not in queue' };
    }

    try {
      const response = await fetch(`/api/queue/${patientQueueStatus.queueId}/leave`, {
        method: 'DELETE',
        headers: useAuthStore.getState().getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error leaving queue');
      }

      set({
        patientQueueStatus: {
          inQueue: false,
          position: null,
          estimatedWait: null,
          queueId: null,
        },
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Asignar siguiente llamada (para empleados)
  assignNextCall: async () => {
    try {
      const data = await apiRequest('/api/queue/next', {
        method: 'POST',
      });
      return { success: true, callId: data.call_id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Asignar llamada específica
  assignSpecificCall: async (queueEntryId) => {
    try {
      const data = await apiRequest(`/api/queue/${queueEntryId}/assign`, {
        method: 'POST',
      });
      return { success: true, callId: data.call_id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- ACCIONES PARA LLAMADAS ACTIVAS ---

  // Cargar llamadas activas
  loadActiveCalls: async () => {
    set({ activeCallsLoading: true });
    
    try {
      const data = await apiRequest('/api/calls/active');
      set({ 
        activeCalls: data.calls || [],
        activeCallsLoading: false,
      });
    } catch (error) {
      set({ activeCallsLoading: false });
      console.error('Error loading active calls:', error);
    }
  },

  // Actualizar llamadas activas (usado por WebSocket)
  updateActiveCalls: (callsData) => {
    set({ activeCalls: callsData });
  },

  // Iniciar llamada
  startCall: async (callData) => {
    try {
      const response = await fetch('/api/calls/start', {
        method: 'POST',
        headers: {
          ...useAuthStore.getState().getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error starting call');
      }

      const data = await response.json();
      
      set({ currentCall: data.call });
      return { success: true, call: data.call };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Terminar llamada
  endCall: async (callId) => {
    try {
      const response = await fetch(`/api/calls/${callId}/end`, {
        method: 'POST',
        headers: useAuthStore.getState().getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error ending call');
      }

      // Limpiar llamada actual si es la que terminamos
      const { currentCall } = get();
      if (currentCall?.id === callId) {
        set({ currentCall: null });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obtener detalles de una llamada
  getCallDetails: async (callId) => {
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        headers: useAuthStore.getState().getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Call not found');
      }

      const data = await response.json();
      return { success: true, call: data.call };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- ACCIONES PARA OBSERVADORES (FAMILIARES) ---

  // Verificar acceso de observador
  checkObserverAccess: async () => {
    const user = useAuthStore.getState().user;
    
    if (user?.role !== 'family') {
      return { success: false, error: 'Access denied' };
    }

    try {
      const response = await fetch('/api/family/observer-access', {
        headers: useAuthStore.getState().getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error checking observer access');
      }

      const data = await response.json();
      
      set({
        observerAccess: {
          canObserve: data.can_observe,
          activeCall: data.active_call,
          patientInfo: data.patient_info,
        },
      });

      return { success: true, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar acceso de observador (usado por WebSocket)
  updateObserverAccess: (accessData) => {
    set({
      observerAccess: {
        ...get().observerAccess,
        ...accessData,
      },
    });
  },

  // --- ACCIONES PARA HISTORIAL ---

  // Cargar historial de llamadas
  loadCallHistory: async () => {
    set({ historyLoading: true });
    
    try {
      const response = await fetch('/api/calls/history', {
        headers: useAuthStore.getState().getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error loading call history');
      }

      const data = await response.json();
      set({ 
        callHistory: data.calls || [],
        historyLoading: false,
      });
    } catch (error) {
      set({ historyLoading: false });
      console.error('Error loading call history:', error);
    }
  },

  // --- TOKENS DE LIVEKIT ---

  // Obtener token para Livekit
  getCallToken: async (callId, options = {}) => {
    try {
      const response = await fetch('/api/calls/token', {
        method: 'POST',
        headers: {
          ...useAuthStore.getState().getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: callId,
          ...options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error getting call token');
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- UTILIDADES ---

  // Limpiar estado de error
  clearQueueError: () => {
    set({ queueError: null });
  },

  // Reiniciar estado de cola del paciente
  resetPatientQueueStatus: () => {
    set({
      patientQueueStatus: {
        inQueue: false,
        position: null,
        estimatedWait: null,
        queueId: null,
      },
    });
  },

  // Actualizar posición en cola (usado por WebSocket)
  updateQueuePosition: (position, estimatedWait) => {
    set({
      patientQueueStatus: {
        ...get().patientQueueStatus,
        position,
        estimatedWait,
      },
    });
  },

  // Marcar que la llamada ha iniciado (para pacientes)
  markCallStarted: (callData) => {
    set({
      currentCall: callData,
      patientQueueStatus: {
        inQueue: false,
        position: null,
        estimatedWait: null,
        queueId: null,
      },
    });
  },

  // Establecer la llamada actual (función genérica)
  setCurrentCall: (callData) => {
    set({ currentCall: callData });
  },

  // Obtener estadísticas rápidas
  getStats: () => {
    const { queueEntries, activeCalls } = get();
    return {
      queueLength: queueEntries.length,
      activeCallsCount: activeCalls.length,
      urgentCalls: queueEntries.filter(entry => entry.priority === 1).length,
    };
  },

  // Filtrar cola por prioridad
  getQueueByPriority: (priority) => {
    const { queueEntries } = get();
    return queueEntries.filter(entry => entry.priority === priority);
  },

  // Verificar si el usuario actual está en una llamada activa
  isUserInActiveCall: () => {
    const { activeCalls } = get();
    const user = useAuthStore.getState().user;
    
    return activeCalls.some(call => 
      call.patient_id === user?.id || call.employee_id === user?.id
    );
  },
}));

export { useCallStore };