import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { useAuthStore } from './stores/authStore';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { LandingPage } from './components/landing/LandingPage';
import PatientDashboard from './components/dashboard/PatientDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { FamilyDashboard } from './components/dashboard/FamilyDashboard';
import VideoCall from './components/video/VideoCall';
import './index.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Componente para rutas públicas (redirige si ya está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para redirigir al dashboard correcto según rol
const DashboardRedirect = () => {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'patient':
      return <Navigate to="/dashboard/patient" replace />;
    case 'employee':
      return <Navigate to="/dashboard/employee" replace />;
    case 'family':
      return <Navigate to="/dashboard/family" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Componente de página no autorizada
const UnauthorizedPage = () => (
  <div className="unauthorized-page">
    <h1>Acceso No Autorizado</h1>
    <p>No tienes permisos para acceder a esta página.</p>
    <button onClick={() => window.location.href = '/dashboard'}>
      Volver al Dashboard
    </button>
  </div>
);

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Verificar autenticación al cargar la app
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />

          {/* Redirección general al dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          {/* Dashboards específicos por rol */}
          <Route path="/dashboard/patient" element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/employee" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/family" element={
            <ProtectedRoute requiredRole="family">
              <FamilyDashboard />
            </ProtectedRoute>
          } />

          {/* Ruta para videollamadas */}
          <Route path="/video-call/:callId" element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          } />

          {/* Página de no autorizado */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Ruta para cualquier otra URL no encontrada */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;