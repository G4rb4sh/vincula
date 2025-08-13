import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      connectionStatus: 'disconnected',

      // Acciones de autenticación
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al iniciar sesión');
          }

          const data = await response.json();
          
          // Persistir en localStorage manualmente para asegurar que se guarde
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            connectionStatus: 'connected'
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Registro de usuario
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al registrar usuario');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            connectionStatus: 'connected'
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Cerrar sesión
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ 
          isAuthenticated: false, 
          user: null, 
          token: null,
          connectionStatus: 'disconnected'
        });
        
        // Redirigir al login si no estamos ya ahí
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
        
        // Redirigir al login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      },

      // Verificar token válido
      verifyToken: async () => {
        const { token } = get();
        
        if (!token) {
          return false;
        }

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            get().logout();
            return false;
          }

          const data = await response.json();
          
          set({
            user: data.user,
            isAuthenticated: true,
            connectionStatus: 'connected'
          });

          return true;
        } catch (error) {
          console.error('Error verifying token:', error);
          get().logout();
          return false;
        }
      },

      // Actualizar perfil de usuario
      updateProfile: async (profileData) => {
        const { token } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar perfil');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            isLoading: false,
            error: null,
            connectionStatus: 'connected'
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Cambiar contraseña
      changePassword: async (passwordData) => {
        const { token } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/change-password', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(passwordData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cambiar contraseña');
          }

          set({
            isLoading: false,
            error: null,
            connectionStatus: 'connected'
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Limpiar errores
      clearError: () => {
        set({ error: null });
      },

      // Obtener información del usuario actual
      getCurrentUser: () => {
        return get().user;
      },

      // Verificar si el usuario tiene un rol específico
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      // Verificar si el usuario tiene alguno de los roles especificados
      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.role);
      },

      // Verificar si es empleado (incluye admin)
      isEmployee: () => {
        const { user } = get();
        return ['employee', 'admin'].includes(user?.role);
      },

      // Verificar si es familiar
      isFamily: () => {
        const { user } = get();
        return user?.role === 'family';
      },

      // Verificar si es paciente
      isPatient: () => {
        const { user } = get();
        return user?.role === 'patient';
      },

      // Verificar si es admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      // Obtener headers de autorización
      getAuthHeaders: () => {
        const { token } = get();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      },

      // Refrescar token
      refreshToken: async () => {
        const { token } = get();
        
        if (!token) {
          return false;
        }

        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            get().logout();
            return false;
          }

          const data = await response.json();
          
          set({
            token: data.token,
            user: data.user,
            connectionStatus: 'connected'
          });

          return true;
        } catch (error) {
          console.error('Error refreshing token:', error);
          get().logout();
          return false;
        }
      },

        // Función para verificar si el token ha expirado
  isTokenExpired: (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true;
    }
  },

  // Función para verificar autenticación
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
      get().logout();
      return false;
    }

    if (get().isTokenExpired(token)) {
      console.log('Token expired, logging out...');
      get().logout();
      // Redirigir al login después de un breve delay para evitar problemas de renderizado
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      return false;
    }

    // Si el token es válido, actualizar el estado
    set({ 
      isAuthenticated: true, 
      user: user,
      token: token,
      connectionStatus: 'connected'
    });
    return true;
  },

  // Función para manejar errores de API relacionados con autenticación
  handleAuthError: (error) => {
    if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
      console.log('Authentication error detected, logging out...');
      get().logout();
      return true;
    }
    return false;
  },

      // Función para verificar autenticación
      checkAuth: () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!token || !user) {
          set({ 
            isAuthenticated: false, 
            user: null, 
            token: null,
            connectionStatus: 'disconnected'
          });
          return false;
        }

        if (get().isTokenExpired(token)) {
          console.log('Token expired, logging out...');
          get().logout();
          return false;
        }

        // Si el token es válido, actualizar el estado
        set({ 
          isAuthenticated: true, 
          user: user,
          token: token,
          connectionStatus: 'connected'
        });
        return true;
      },

      // Función para manejar errores de API relacionados con autenticación
      handleAuthError: (error) => {
        if (error?.response?.status === 401 || error?.message?.includes('Unauthorized')) {
          console.log('Authentication error detected, logging out...');
          get().logout();
          return true;
        }
        return false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };