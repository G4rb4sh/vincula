// Use environment variable for API URL, fallback to relative path for development
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Si es error 401, limpiar token y redirigir
      if (response.status === 401) {
        console.log('Authentication error detected, clearing session...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Solo redirigir si no estamos ya en login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      error.response = { status: response.status, statusText: response.statusText };
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    // Si no es un error de fetch, propagar el error original
    if (error.name !== 'TypeError') {
      throw error;
    }
    
    console.error('API request failed:', error);
    throw new Error('Error de conexión con el servidor');
  }
};