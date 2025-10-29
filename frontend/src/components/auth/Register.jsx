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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Info,
  Videocam,
  RadioButtonChecked,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'patient',
    recordingConsent: false,
    livestreamConsent: false
  });
  const [loading, setLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentErrors, setConsentErrors] = useState({});
  
  const navigate = useNavigate();
  const { register, error } = useAuthStore();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Limpiar errores de consentimiento cuando se marcan
    if (type === 'checkbox' && checked) {
      setConsentErrors({
        ...consentErrors,
        [name]: false
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Validar consentimientos obligatorios
    const errors = {};
    if (!formData.recordingConsent) {
      errors.recordingConsent = 'Debe aceptar la grabación automática de llamadas';
    }
    if (!formData.livestreamConsent) {
      errors.livestreamConsent = 'Debe aceptar el livestreaming de llamadas';
    }

    if (Object.keys(errors).length > 0) {
      setConsentErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        recording_consent: formData.recordingConsent,
        livestream_consent: formData.livestreamConsent,
        consent_accepted_at: new Date().toISOString()
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

              {/* Consentimientos Obligatorios */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: (consentErrors.recordingConsent || consentErrors.livestreamConsent) ? 'error.main' : 'grey.300'
              }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                    Términos de Consentimiento
                  </Typography>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          name="recordingConsent"
                          checked={formData.recordingConsent}
                          onChange={handleChange}
                          color="primary"
                          required
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <RadioButtonChecked sx={{ fontSize: 18, color: 'error.main' }} />
                          <Typography variant="body2">
                            Acepto que todas mis videollamadas serán <strong>grabadas automáticamente</strong> 
                            para fines médicos y de seguimiento.
                          </Typography>
                        </Stack>
                      }
                    />
                    {consentErrors.recordingConsent && (
                      <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                        {consentErrors.recordingConsent}
                      </Typography>
                    )}

                    <FormControlLabel
                      control={
                        <Checkbox 
                          name="livestreamConsent"
                          checked={formData.livestreamConsent}
                          onChange={handleChange}
                          color="primary"
                          required
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Videocam sx={{ fontSize: 18, color: 'warning.main' }} />
                          <Typography variant="body2">
                            Acepto que mis videollamadas puedan ser <strong>vistas en vivo</strong> 
                            por familiares autorizados y personal médico.
                          </Typography>
                        </Stack>
                      }
                    />
                    {consentErrors.livestreamConsent && (
                      <Typography variant="caption" color="error" sx={{ ml: 4 }}>
                        {consentErrors.livestreamConsent}
                      </Typography>
                    )}
                  </FormGroup>

                  <Button
                    size="small"
                    startIcon={<Info />}
                    onClick={() => setShowConsentDialog(true)}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    Más información sobre estos términos
                  </Button>
                </Stack>
              </Box>

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

        {/* Diálogo de Información de Consentimientos */}
        <Dialog
          open={showConsentDialog}
          onClose={() => setShowConsentDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={2} alignItems="center">
              <Info color="primary" />
              <Typography variant="h6">Política de Grabación y Transmisión en Vivo</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <RadioButtonChecked color="error" />
                  <Typography variant="h6" color="text.primary">
                    Grabación Automática
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Todas las videollamadas médicas en Vincula se graban automáticamente desde el momento 
                  en que inician. Esto incluye:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li>
                    <Typography variant="body2">
                      Consultas médicas entre pacientes y profesionales de salud
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Sesiones de acompañamiento virtual con familiares
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Audio, video y cualquier contenido compartido en pantalla
                    </Typography>
                  </li>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Las grabaciones se almacenan de forma segura y cifrada, cumpliendo con las normativas 
                  de privacidad médica. Solo tendrán acceso a ellas:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li>
                    <Typography variant="body2">El paciente involucrado</Typography>
                  </li>
                  <li>
                    <Typography variant="body2">Los profesionales médicos tratantes</Typography>
                  </li>
                  <li>
                    <Typography variant="body2">Familiares autorizados por el paciente</Typography>
                  </li>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Videocam color="warning" />
                  <Typography variant="h6" color="text.primary">
                    Transmisión en Vivo
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Las videollamadas pueden ser vistas en tiempo real por personas autorizadas:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li>
                    <Typography variant="body2">
                      <strong>Familiares:</strong> Solo pueden ver las llamadas de sus familiares 
                      registrados y vinculados en el sistema
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Personal Médico:</strong> Pueden acceder a cualquier llamada activa 
                      para supervisión y apoyo médico
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>Modo Observador:</strong> Los familiares que observan no pueden 
                      interactuar ni ser vistos por los participantes activos
                    </Typography>
                  </li>
                </Box>
              </Box>

              <Alert severity="info">
                <Typography variant="body2">
                  Estos consentimientos son <strong>obligatorios</strong> para usar Vincula. 
                  La plataforma está diseñada para maximizar la transparencia y el acompañamiento 
                  en el cuidado médico, garantizando siempre la seguridad y privacidad de la información.
                </Typography>
              </Alert>

              <Alert severity="warning">
                <Typography variant="body2">
                  Al aceptar estos términos, usted comprende y acepta que todas sus interacciones 
                  en la plataforma serán grabadas y podrán ser vistas en tiempo real por las 
                  personas autorizadas según su rol en el sistema.
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowConsentDialog(false)} variant="contained">
              Entendido
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};