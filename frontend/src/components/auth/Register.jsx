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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PersonAdd,
  Email,
  Lock,
  Person,
  Group,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'patient'
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register, error } = useAuthStore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role
      };

      const result = await register(userData);
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        console.error('Registration failed:', result.error);
      }
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'patient': return 'Paciente';
      case 'employee': return 'Empleado Médico';
      case 'family': return 'Familiar';
      case 'admin': return 'Administrador';
      default: return role;
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
            maxWidth: 500,
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
              Crear Cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Únete a nuestra plataforma de acompañamiento médico
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

            <Stack spacing={3}>
              {/* Información Personal */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="Nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <Person sx={{ color: 'action.active', mr: 1 }} />
                    ),
                  }}
                />
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <Person sx={{ color: 'action.active', mr: 1 }} />
                    ),
                  }}
                />
              </Stack>

              {/* Email */}
              <TextField
                required
                fullWidth
                name="email"
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ color: 'action.active', mr: 1 }} />
                  ),
                }}
              />

              {/* Rol */}
              <FormControl fullWidth required>
                <InputLabel>Tipo de Usuario</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Tipo de Usuario"
                  onChange={handleChange}
                  startAdornment={<Group sx={{ color: 'action.active', mr: 1 }} />}
                >
                  <MenuItem value="patient">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Person fontSize="small" />
                      <Typography>Paciente</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="employee">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonAdd fontSize="small" />
                      <Typography>Empleado Médico</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="family">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Group fontSize="small" />
                      <Typography>Familiar</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Contraseñas */}
              <TextField
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <Lock sx={{ color: 'action.active', mr: 1 }} />
                  ),
                }}
              />

              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Contraseña"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <Lock sx={{ color: 'action.active', mr: 1 }} />
                  ),
                }}
              />

              {/* Botón de Registro */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Links */}
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes cuenta?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    color: '#1976D2', 
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Iniciar Sesión
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
        </Paper>
      </Box>
    </Container>
  );
};