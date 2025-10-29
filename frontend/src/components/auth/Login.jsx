import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,

  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Email,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, error } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({ email: email.trim(), password });
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, navigating to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
          }}
        >
          {/* Logo y Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
              Vincula
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom>
              Iniciar Sesión
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accede a tu cuenta de acompañamiento médico
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Email sx={{ color: 'action.active', mr: 1 }} />
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Lock sx={{ color: 'action.active', mr: 1 }} />
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                py: 1.5,
                mb: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <Divider sx={{ mb: 3 }} />

            {/* Links */}
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                ¿No tienes cuenta?{' '}
                <Link 
                  to="/register" 
                  style={{ 
                    color: '#1976D2', 
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Crear Cuenta
                </Link>
              </Typography>
              <Typography variant="body2">
                <Link 
                  to="/" 
                  style={{ 
                    color: '#1976D2', 
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  ← Volver al inicio
                </Link>
              </Typography>
            </Stack>
          </Box>

          {/* Información de prueba */}
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              mt: 3, 
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              <strong>Cuentas de prueba:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • Paciente: patient@vincula.com / 123456
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • Doctor: doctor@vincula.com / 123456
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • Familiar: family@vincula.com / 123456
            </Typography>
          </Paper>
        </Paper>
      </Box>
    </Container>
  );
};