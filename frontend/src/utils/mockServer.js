// Mock server para desarrollo local sin backend
const MOCK_USERS = [
  {
    id: 1,
    email: 'patient@test.com',
    password: '123456',
    name: 'Juan Pérez',
    role: 'patient'
  },
  {
    id: 2,
    email: 'doctor@test.com',
    password: '123456',
    name: 'Dr. Ana García',
    role: 'employee'
  },
  {
    id: 3,
    email: 'family@test.com',
    password: '123456',
    name: 'María López',
    role: 'family'
  }
];

// Función para generar JWT mock
const generateMockToken = (user) => {
  // En una implementación real, esto sería un JWT firmado
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
  };
  
  // Codificamos en base64 para simular un JWT (¡NO usar en producción!)
  return btoa(JSON.stringify(payload));
};

// Interceptar fetch para simular el backend
const originalFetch = window.fetch;

window.fetch = async (url, options = {}) => {
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  
  // Solo interceptar llamadas a nuestro API
  if (url.startsWith(baseURL)) {
    const endpoint = url.replace(baseURL, '');
    const method = options.method || 'GET';
    
    console.log(`🟡 Mock API: ${method} ${endpoint}`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Login endpoint
    if (endpoint === '/api/auth/login' && method === 'POST') {
      const body = JSON.parse(options.body);
      const user = MOCK_USERS.find(u => u.email === body.email && u.password === body.password);
      
      if (user) {
        const token = generateMockToken(user);
        const response = {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token: token
        };
        
        console.log('✅ Mock login successful:', response);
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        const errorResponse = {
          success: false,
          message: 'Credenciales inválidas'
        };
        
        console.log('❌ Mock login failed');
        
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Register endpoint
    if (endpoint === '/api/auth/register' && method === 'POST') {
      const body = JSON.parse(options.body);
      
      // Verificar si el email ya existe
      const existingUser = MOCK_USERS.find(u => u.email === body.email);
      if (existingUser) {
        const errorResponse = {
          success: false,
          message: 'El email ya está registrado'
        };
        
        console.log('❌ Mock register failed: email exists');
        
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Crear nuevo usuario
      const newUser = {
        id: MOCK_USERS.length + 1,
        email: body.email,
        password: body.password,
        name: body.name,
        role: body.role || 'patient'
      };
      
      MOCK_USERS.push(newUser);
      
      const token = generateMockToken(newUser);
      const response = {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token: token
      };
      
      console.log('✅ Mock register successful:', response);
      
      return new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify token endpoint
    if (endpoint === '/api/auth/me' && method === 'GET') {
      const authHeader = options.headers?.Authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ message: 'No token provided' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const payload = JSON.parse(atob(token));
        const user = MOCK_USERS.find(u => u.id === payload.id);
        
        if (user && payload.exp > Math.floor(Date.now() / 1000)) {
          const response = {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          };
          
          console.log('✅ Mock token verification successful');
          
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          console.log('❌ Mock token verification failed: expired or invalid');
          
          return new Response(JSON.stringify({ message: 'Token expired or invalid' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.log('❌ Mock token verification failed: parse error');
        
        return new Response(JSON.stringify({ message: 'Invalid token format' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Queue endpoints mock
    if (endpoint.startsWith('/api/queue')) {
      const mockResponse = {
        success: true,
        position: Math.floor(Math.random() * 5) + 1,
        estimatedWaitTime: Math.floor(Math.random() * 600) + 300 // 5-15 min
      };
      
      console.log('✅ Mock queue response:', mockResponse);
      
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Call history mock
    if (endpoint.startsWith('/api/calls/history')) {
      const mockCalls = [];
      for (let i = 0; i < 3; i++) {
        mockCalls.push({
          id: `call-${i + 1}`,
          startedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          duration: Math.floor(Math.random() * 1800) + 300, // 5-35 min
          employeeName: `Dr. ${['García', 'López', 'Martínez'][i]}`,
          status: 'completed',
          recordingUrl: i === 0 ? '#' : null
        });
      }
      
      const response = { calls: mockCalls };
      
      console.log('✅ Mock call history response:', response);
      
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default mock response for unhandled endpoints
    console.log('⚠️ Mock API: Unhandled endpoint, returning 404');
    
    return new Response(JSON.stringify({ message: 'Endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Para URLs externas, usar fetch original
  return originalFetch(url, options);
};

console.log('🟡 Mock server initialized. Use these test accounts:');
console.log('  Patient: patient@test.com / 123456');
console.log('  Doctor: doctor@test.com / 123456');
console.log('  Family: family@test.com / 123456'); 