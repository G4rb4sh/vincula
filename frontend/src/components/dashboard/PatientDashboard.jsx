import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,

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

  People,
  Favorite,
  Star,
  Timer,
  PhoneInTalk,
  HealthAndSafety,
  MedicalServices,
  Notifications,
  Home,
  ArrowBack,
  PlayCircleOutline,
  Support,
  ArticleOutlined,
  SummarizeOutlined
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useCallStore } from '../../stores/callStore';
import { useWebSocket, useCallRedirection } from '../../hooks/useWebSocket';
import { apiRequest } from '../../utils/api';

function PatientDashboard() {
  const { user, handleAuthError, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Estados para el historial de llamadas
  const [callHistory, setCallHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Estado para tabs del historial y grabaciones
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Hook para redirección automática a videollamadas
  const { isConnected: wsConnected } = useCallRedirection();

  // Función para unirse a la cola
  const joinQueue = async () => {
    try {
      setLoadingQueue(true);
      console.log('🏥 Intentando unirse a la cola...', { reason: 'Solicitud de acompañamiento', priority: 3 });
      
      const response = await apiRequest('/api/queue/join', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Solicitud de acompañamiento',
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
      // Intentar diferentes endpoints hasta encontrar el correcto
      let history;
      try {
        history = await apiRequest(`/api/calls/history?userId=${user.id}`);
      } catch (firstError) {
        console.warn('First endpoint failed, trying alternative:', firstError.message);
        try {
          history = await apiRequest(`/api/calls/patient/${user.id}/history`);
        } catch (secondError) {
          console.warn('Second endpoint failed, using mock data:', secondError.message);
          // Usar datos de prueba mientras se arregla el backend
          history = { calls: [] };
        }
      }
      setCallHistory(history.calls || []);
    } catch (error) {
      console.error('Error fetching call history:', error);
      if (error?.response?.status === 401) {
        handleAuthError(error);
      }
      // Usar datos de prueba para desarrollo
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
        <Box 
          sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            mb: 2, 
            bgcolor: 'primary.main',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h2" color="white" fontWeight="bold">
            V
          </Typography>
        </Box>
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
      {/* Header de navegación */}
      <Box component="header" sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', py: 2 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography 
              variant="h4" 
              component="h1" 
              onClick={() => navigate('/')}
              sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                '&:hover': { color: 'primary.dark' }
              }}
            >
              Vincula
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Hola, {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}
              </Typography>
              <Button 
                variant="outlined"
                onClick={logout}
                startIcon={<ExitToApp />}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header mejorado */}
        <Slide direction="down" in={true} mountOnEnter unmountOnExit>
          <Paper 
            elevation={4} 
            sx={{ 
              p: 4, 
              mb: 4, 
              background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
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
                  Mi Portal
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
                        icon={<Support />}
                        label="Usuario Activo"
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

        {/* Panel Principal con Tabs */}
        <Card elevation={6} sx={{ borderRadius: 4, mb: 4 }}>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <PhoneInTalk fontSize="large" />
              </Avatar>
            }
            title="Portal de Acompañamiento"
            subheader="Solicita acompañamiento o revisa tu historial de sesiones"
          />
          
          {/* Tabs Header */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedTab} 
              onChange={(_, newValue) => setSelectedTab(newValue)}
              sx={{ px: 3 }}
            >
              <Tab 
                icon={<PhoneInTalk />} 
                label="Solicitar Acompañamiento" 
                iconPosition="start" 
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
              <Tab 
                icon={<History />} 
                label="Mi Historial & Grabaciones" 
                iconPosition="start" 
                sx={{ textTransform: 'none', fontWeight: 500 }}
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <CardContent>
            {/* Tab 1: Solicitar Acompañamiento */}
            {selectedTab === 0 && (
              <Box>

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
                            ¿Necesitas Acompañamiento?
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                            Solicita un acompañante virtual para hablar, recibir apoyo emocional o acompañamiento durante procedimientos. 
                            Te conectaremos con el siguiente acompañante disponible.
                          </Typography>
                        </Box>
                        
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                          <Chip icon={<Timer />} label="Tiempo promedio: 5-10 min" color="info" />
                          <Chip icon={<People />} label="Acompañantes disponibles" color="success" />
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
              </Box>
            )}

            {/* Tab 2: Mi Historial & Grabaciones */}
            {selectedTab === 1 && (
              <Box>
                <Grid container spacing={4}>
                  {/* Historial de Sesiones */}
                  <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <History color="primary" />
                        Historial de Sesiones
                      </Typography>
                      
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
                        <Box sx={{ textAlign: 'center', py: 6 }}>
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
                            No tienes sesiones anteriores
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cuando tengas tu primera sesión, aparecerá aquí
                          </Typography>
                        </Box>
                      ) : (
                        <Stack spacing={3}>
                          {callHistory.map((call, index) => (
                            <Paper 
                              key={call.id}
                              elevation={2} 
                              sx={{ 
                                p: 3, 
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                  boxShadow: 4,
                                  borderColor: 'primary.light'
                                }
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                <Box>
                                  <Typography variant="h6" fontWeight="bold">
                                    Sesión de Acompañamiento #{index + 1}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(call.created_at)}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={call.status || 'Completada'}
                                  color={call.status === 'completed' ? 'success' : 'default'}
                                  size="small"
                                />
                              </Stack>
                              
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Acompañante:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="500">
                                    {call.companionName || 'Acompañante Virtual'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" color="text.secondary">
                                    Duración:
                                  </Typography>
                                  <Typography variant="body2" fontWeight="500">
                                    {formatDuration(call.duration)}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                  </Grid>

                  {/* Panel Derecho - Grabaciones y Resúmenes */}
                  <Grid item xs={12} lg={4}>
                    <Grid container spacing={2}>
                      {/* Grabaciones */}
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PlayCircleOutline color="primary" />
                            Grabaciones
                          </Typography>
                          
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.light', 
                                width: 50, 
                                height: 50, 
                                mx: 'auto', 
                                mb: 2 
                              }}
                            >
                              <PlayCircleOutline fontSize="medium" />
                            </Avatar>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                              Disponibles Pronto
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Todas las sesiones se graban automáticamente
                            </Typography>
                            <Alert severity="info" sx={{ textAlign: 'left' }}>
                              <Typography variant="caption">
                                • Audio y video<br/>
                                • Búsqueda por fecha<br/>
                                • Compartir con familia
                              </Typography>
                            </Alert>
                          </Box>
                        </Paper>
                      </Grid>

                      {/* Resúmenes de Sesiones */}
                      <Grid item xs={12} sm={6}>
                        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ArticleOutlined color="secondary" />
                            Resúmenes
                          </Typography>
                          
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'secondary.light', 
                                width: 50, 
                                height: 50, 
                                mx: 'auto', 
                                mb: 2 
                              }}
                            >
                              <SummarizeOutlined fontSize="medium" />
                            </Avatar>
                            <Typography variant="body1" fontWeight="600" gutterBottom>
                            Disponibles Pronto
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Transcripciones y puntos clave con IA
                            </Typography>
                            <Alert severity="success" sx={{ textAlign: 'left' }}>
                              <Typography variant="caption">
                                • Transcripción automática<br/>
                                • Puntos clave<br/>
                                • Temas principales<br/>
                                • Recomendaciones
                              </Typography>
                            </Alert>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>



        {/* Dialog de bienvenida */}
        <WelcomeDialog />
      </Container>
    </Box>
  );
}

export default PatientDashboard;