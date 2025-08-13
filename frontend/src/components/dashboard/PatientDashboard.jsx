import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  IconButton,
  LinearProgress,
  Fade,
  Slide,
  Zoom,
  CardActions,
  CardHeader,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,

} from '@mui/material';
import {
  PersonOutline,
  AccessTime,
  Phone,
  History,
  Schedule,
  Emergency,
  VideoCall,
  ExitToApp,
  Refresh,
  CheckCircle,
  Cancel,
  PlayArrow,
  QueueMusic,
  TrendingUp,
  Info,
  ExpandMore,
  LocalHospital,
  People,
  Favorite,
  Star,
  Timer,
  PhoneInTalk,
  HealthAndSafety,
  MedicalServices,
  Notifications,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useCallStore } from '../../stores/callStore';
import { useWebSocket, useCallRedirection } from '../../hooks/useWebSocket';
import { apiRequest } from '../../utils/api';

function PatientDashboard() {
  const { user, handleAuthError } = useAuthStore();
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Estados para el historial de llamadas
  const [callHistory, setCallHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Hook de WebSocket para recibir notificaciones
  const { connectionStatus } = useWebSocket();
  
  // Hook para redirección automática a videollamadas
  const { isConnected: wsConnected } = useCallRedirection();

  // Función para unirse a la cola
  const joinQueue = async () => {
    try {
      setLoadingQueue(true);
      console.log('🏥 Intentando unirse a la cola...', { reason: 'Consulta médica general', priority: 3 });
      
      const response = await apiRequest('/api/queue/join', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Consulta médica general',
          priority: 3,
          notes: ''
        })
      });
      
      console.log('✅ Respuesta de la cola:', response);
      
      setIsInQueue(true);
      setQueuePosition(response.position);
      setEstimatedWaitTime(response.estimated_wait);
      
      console.log('📊 Estado actualizado - En cola:', { 
        position: response.position, 
        estimatedWaitTime: response.estimated_wait 
      });
    } catch (error) {
      console.error('❌ Error joining queue:', error);
      if (error?.response?.status === 401) {
        handleAuthError(error);
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  // Función para salir de la cola
  const leaveQueue = async () => {
    try {
      setLoadingQueue(true);
      await apiRequest('/api/queue/leave', {
        method: 'POST',
        body: JSON.stringify({
          patientId: user.id
        })
      });
      
      setIsInQueue(false);
      setQueuePosition(null);
      setEstimatedWaitTime(null);
    } catch (error) {
      console.error('Error leaving queue:', error);
      if (error?.response?.status === 401) {
        handleAuthError(error);
      }
    } finally {
      setLoadingQueue(false);
    }
  };

  // Función para verificar estado en cola
  const checkQueueStatus = async () => {
    try {
      const response = await apiRequest(`/api/queue/status?patientId=${user.id}`);
      if (response.inQueue) {
        setIsInQueue(true);
        setQueuePosition(response.position);
        setEstimatedWaitTime(response.estimatedWaitTime);
      } else {
        setIsInQueue(false);
        setQueuePosition(null);
        setEstimatedWaitTime(null);
      }
    } catch (error) {
      console.error('Error checking queue status:', error);
      if (error?.response?.status === 401) {
        handleAuthError(error);
      }
    }
  };

  // Función para obtener historial de llamadas
  const fetchCallHistory = async () => {
    try {
      setLoadingHistory(true);
      if (!user?.id) {
        console.warn('User ID not available, skipping call history fetch');
        setCallHistory([]);
        return;
      }
      const history = await apiRequest(`/api/calls/history?patientId=${user.id}`);
      setCallHistory(history.calls || []);
    } catch (error) {
      console.error('Error fetching call history:', error);
      if (error?.response?.status === 401) {
        handleAuthError(error);
      }
      setCallHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Función para formatear duración
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      checkQueueStatus();
      fetchCallHistory();
      setShowWelcomeDialog(true);
    }
  }, [user?.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'in_progress': return 'En progreso';
      default: return status;
    }
  };

  // Componente de bienvenida
  const WelcomeDialog = () => (
    <Dialog open={showWelcomeDialog} onClose={() => setShowWelcomeDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
          <LocalHospital fontSize="large" />
        </Avatar>
        <Typography variant="h4" color="primary" fontWeight="bold">
          ¡Bienvenido a Vincula!
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ textAlign: 'center' }}>
          <Typography variant="h6">
            Hola {user?.first_name}, estamos aquí para acompañarte
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tu plataforma de videollamadas médicas está lista. Puedes unirte a la cola 
            cuando necesites hablar con un profesional de la salud.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
            <Stack alignItems="center" spacing={1}>
              <VideoCall color="primary" fontSize="large" />
              <Typography variant="body2">Videollamadas</Typography>
            </Stack>
            <Stack alignItems="center" spacing={1}>
              <People color="primary" fontSize="large" />
              <Typography variant="body2">Profesionales</Typography>
            </Stack>
            <Stack alignItems="center" spacing={1}>
              <HealthAndSafety color="primary" fontSize="large" />
              <Typography variant="body2">Seguro</Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button 
          variant="contained" 
          size="large" 
          onClick={() => setShowWelcomeDialog(false)}
          sx={{ px: 4 }}
        >
          ¡Entendido!
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header mejorado */}
        <Slide direction="down" in={true} mountOnEnter unmountOnExit>
          <Paper 
            elevation={4} 
            sx={{ 
              p: 4, 
              mb: 4, 
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                transform: 'translate(50%, -50%)'
              }}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  Panel del Paciente
                </Typography>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 60, 
                      height: 60,
                      border: '3px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <PersonOutline fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                      {user?.first_name} {user?.last_name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Chip
                        icon={connectionStatus === 'connected' ? <CheckCircle /> : <Cancel />}
                        label={connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                        color={connectionStatus === 'connected' ? 'success' : 'error'}
                        sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
                      />
                      <Chip
                        icon={<Star />}
                        label="Paciente Activo"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Box>
              
              <Stack alignItems="center" spacing={2}>
                <Tooltip title="Actualizar estado">
                  <IconButton 
                    onClick={checkQueueStatus} 
                    sx={{ 
                      color: 'white', 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
                {isInQueue && (
                  <Stack alignItems="center" spacing={1}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                      #{queuePosition}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      En cola
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Slide>

        <Grid container spacing={4}>
          {/* Sección de Cola Principal */}
          <Grid item xs={12} lg={8}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card elevation={6} sx={{ borderRadius: 4 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <VideoCall fontSize="large" />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      Atención Médica
                    </Typography>
                  }
                  subheader="Conéctate con nuestros profesionales de la salud"
                  sx={{ pb: 2 }}
                />
                <CardContent sx={{ pt: 0 }}>
            {!isInQueue ? (
                    <Box>
                      {/* Estado sin cola */}
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 4, 
                          textAlign: 'center', 
                          bgcolor: 'grey.50',
                          borderRadius: 3,
                          border: '2px dashed',
                          borderColor: 'grey.300'
                        }}
                      >
                        <Box sx={{ mb: 3 }}>
                          <Avatar 
                            sx={{ 
                              width: 100, 
                              height: 100, 
                              mx: 'auto', 
                              mb: 2,
                              bgcolor: 'primary.light'
                            }}
                          >
                            <PhoneInTalk fontSize="large" />
                          </Avatar>
                          <Typography variant="h5" gutterBottom fontWeight="600">
                            ¿Necesitas atención médica?
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                            Únete a nuestra cola de atención para hablar con un profesional de la salud. 
                            Te conectaremos con el siguiente especialista disponible.
                          </Typography>
                        </Box>
                        
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                          <Chip icon={<Timer />} label="Tiempo promedio: 5-10 min" color="info" />
                          <Chip icon={<People />} label="Profesionales disponibles" color="success" />
                        </Stack>

                        <Button
                          variant="contained"
                          size="large"
                  onClick={joinQueue}
                  disabled={loadingQueue}
                          startIcon={loadingQueue ? <CircularProgress size={20} /> : <VideoCall />}
                          sx={{ 
                            px: 6, 
                            py: 2, 
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            borderRadius: 3,
                            boxShadow: 3
                          }}
                        >
                          {loadingQueue ? 'Conectando...' : 'Solicitar Atención'}
                        </Button>
                      </Paper>
                    </Box>
                  ) : (
                    <Box>
                      {/* Estado en cola */}
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mb: 3, 
                          borderRadius: 3,
                          '& .MuiAlert-message': { width: '100%' }
                        }}
                      >
                        <Stack spacing={2}>
                          <Typography variant="h6" fontWeight="bold">
                            🎯 Estás en la cola de atención
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={4}>
                              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                <Typography variant="h3" color="primary" fontWeight="bold">
                                  {queuePosition}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Posición en cola
                                </Typography>
                              </Paper>
                            </Grid>
                    {estimatedWaitTime && (
                              <Grid item xs={12} sm={4}>
                                <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                  <Typography variant="h3" color="warning.main" fontWeight="bold">
                                    {Math.round(estimatedWaitTime / 60)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Minutos aprox.
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                            <Grid item xs={12} sm={4}>
                              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                                <Typography variant="h3" color="success.main" fontWeight="bold">
                                  <AccessTime />
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Esperando
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>

                          <LinearProgress 
                            variant="indeterminate" 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'grey.200'
                            }} 
                          />
                          
                          <Typography variant="body1" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
                            💡 Mantén esta ventana abierta. Te conectaremos automáticamente cuando sea tu turno.
                          </Typography>
                        </Stack>
                      </Alert>

                      <Box sx={{ textAlign: 'center' }}>
                        <Button
                          variant="outlined"
                          color="error"
                    onClick={leaveQueue}
                    disabled={loadingQueue}
                          startIcon={loadingQueue ? <CircularProgress size={20} /> : <ExitToApp />}
                          sx={{ borderRadius: 3 }}
                  >
                    {loadingQueue ? 'Saliendo...' : 'Salir de la Cola'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {/* Panel lateral */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Información de servicio */}
              <Fade in={true} style={{ transitionDelay: '200ms' }}>
                <Card elevation={4} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <MedicalServices color="primary" fontSize="large" />
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        Nuestros Servicios
                      </Typography>
                    </Stack>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                          <CheckCircle fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">Consultas médicas generales</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                          <CheckCircle fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">Apoyo psicológico</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                          <CheckCircle fontSize="small" />
                        </Avatar>
                        <Typography variant="body2">Acompañamiento familiar</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>

              {/* Horarios */}
              <Fade in={true} style={{ transitionDelay: '300ms' }}>
                <Card elevation={4} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Schedule color="primary" fontSize="large" />
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        Horarios de Atención
                      </Typography>
                    </Stack>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <AccessTime color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Lunes a Viernes" 
                          secondary="8:00 AM - 8:00 PM" 
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <AccessTime color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Sábados" 
                          secondary="9:00 AM - 5:00 PM"
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <AccessTime color="action" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Domingos" 
                          secondary="10:00 AM - 4:00 PM"
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Fade>

              {/* Emergencia */}
              <Fade in={true} style={{ transitionDelay: '400ms' }}>
                <Card 
                  elevation={4} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                    color: 'white'
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Emergency sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Emergencia Médica
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                      Si tienes una emergencia médica, llama inmediatamente al:
                    </Typography>
                    <Typography variant="h2" fontWeight="bold" sx={{ mb: 2 }}>
                      911
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Disponible 24/7
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Stack>
          </Grid>

          {/* Historial de Llamadas */}
          <Grid item xs={12}>
            <Fade in={true} style={{ transitionDelay: '500ms' }}>
              <Card elevation={6} sx={{ borderRadius: 4 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                      <History fontSize="large" />
                    </Avatar>
                  }
                  title={
                    <Typography variant="h4" color="secondary" fontWeight="bold">
                      Historial de Consultas
                    </Typography>
                  }
                  subheader="Revisa tus consultas médicas anteriores"
                />
                <CardContent>
            {loadingHistory ? (
                    <Box display="flex" justifyContent="center" py={6}>
                      <Stack alignItems="center" spacing={2}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary">
                          Cargando historial...
                        </Typography>
                      </Stack>
                    </Box>
            ) : callHistory.length === 0 ? (
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 6, 
                        textAlign: 'center', 
                        bgcolor: 'grey.50',
                        borderRadius: 3
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          mx: 'auto', 
                          mb: 2,
                          bgcolor: 'grey.300'
                        }}
                      >
                        <History fontSize="large" />
                      </Avatar>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tienes consultas anteriores
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cuando realices tu primera consulta, aparecerá aquí
                      </Typography>
                    </Paper>
                  ) : (
                    <Stack spacing={3}>
                      {callHistory.map((call, index) => (
                        <Box key={call.id} sx={{ position: 'relative' }}>
                          {/* Línea conectora visual */}
                          {index < callHistory.length - 1 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 28,
                                top: 56,
                                bottom: -24,
                                width: 2,
                                bgcolor: 'grey.300',
                                zIndex: 0
                              }}
                            />
                          )}
                          
                          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, position: 'relative', zIndex: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                              {/* Indicador visual */}
                              <Avatar 
                                sx={{ 
                                  bgcolor: getStatusColor(call.status) === 'success' ? 'success.main' : 
                                          getStatusColor(call.status) === 'error' ? 'error.main' : 'warning.main',
                                  width: 56,
                                  height: 56,
                                  flexShrink: 0
                                }}
                              >
                                <Phone fontSize="large" />
                              </Avatar>
                              
                              {/* Contenido principal */}
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                  <Box>
                                    <Typography variant="h6" fontWeight="600" gutterBottom>
                                      Consulta Médica
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {formatDate(call.startedAt)}
                                    </Typography>
                                  </Box>
                                  <Chip
                                    label={getStatusText(call.status)}
                                    color={getStatusColor(call.status)}
                                    variant="filled"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </Stack>
                                
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                  <Grid item xs={12} sm={6}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                                        <People fontSize="small" />
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Atendido por
                                        </Typography>
                                        <Typography variant="body2" fontWeight="500">
                                          {call.employeeName || 'Dr. Profesional'}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Grid>
                                  <Grid item xs={12} sm={6}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Avatar sx={{ bgcolor: 'secondary.light', width: 32, height: 32 }}>
                                        <Timer fontSize="small" />
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Duración
                                        </Typography>
                                        <Typography variant="body2" fontWeight="500">
                                          {formatDuration(call.duration)}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Grid>
                                </Grid>
                                
                    {call.recordingUrl && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PlayArrow />}
                          href={call.recordingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                                    sx={{ borderRadius: 2 }}
                        >
                          Ver Grabación
                                  </Button>
                                )}
                              </Box>
                            </Stack>
                          </Paper>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Dialog de bienvenida */}
        <WelcomeDialog />
      </Container>
    </Box>
  );
}

export default PatientDashboard;