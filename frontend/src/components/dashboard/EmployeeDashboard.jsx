import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Box,
  Stack,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Divider,
  Tabs,
  Tab,
  CardHeader,
} from '@mui/material';
import {
  PersonOutline,
  Phone,
  AccessTime,
  PriorityHigh,
  Refresh,
  VideoCall,
  Queue,
  CheckCircle,
  Cancel,
  Warning,
  PlayArrow,
  Groups,
  ExitToApp,
  PhoneInTalk,
  History,
  PlayCircleOutline,
  ArticleOutlined,
  SummarizeOutlined,
  Support,
} from '@mui/icons-material';
import { useCallStore } from '../../stores/callStore';
import { useAuthStore } from '../../stores/authStore';
import { useQueueUpdates, useNotifications } from '../../hooks/useWebSocket';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    queueEntries, 
    activeCalls, 
    queueLoading, 
    queueError,
    loadQueue, 
    loadActiveCalls, 
    assignNextCall, 
    assignSpecificCall,
    getStats 
  } = useCallStore();

  const { queueData, activeCallsData, isConnected } = useQueueUpdates();
  const { notifications } = useNotifications();

  const [selectedPriority, setSelectedPriority] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadQueue();
    loadActiveCalls();
  }, [loadQueue, loadActiveCalls]);

  const handleNextCall = async () => {
    setRefreshing(true);
    try {
      const result = await assignNextCall();
      if (result.success) {
        navigate(`/video-call/${result.callId}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting next call:', error);
      alert('Error al asignar la siguiente llamada');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSpecificCall = async (entryId) => {
    try {
          const result = await assignSpecificCall(entryId);
    if (result.success) {
      navigate(`/video-call/${result.callId}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error starting specific call:', error);
      alert('Error al asignar la llamada');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadQueue(), loadActiveCalls()]);
    setRefreshing(false);
  };

  const filteredQueue = selectedPriority === 'all' 
    ? queueEntries 
    : queueEntries.filter(entry => entry.priority === parseInt(selectedPriority));

  const stats = getStats();

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Urgente';
      case 2: return 'Normal';
      case 3: return 'Rutina';
      default: return 'Normal';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'default';
    }
  };

  const formatWaitTime = (waitingSince) => {
    const minutes = Math.floor((Date.now() - new Date(waitingSince).getTime()) / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  return (
    <>
      {/* Header Navigation */}
      <Box component="header" sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0', py: 2 }}>
        <Container maxWidth="xl">
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
                Hola, {user?.first_name || user?.email?.split('@')[0] || 'Acompañante'}
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

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Principal */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Portal de Acompañante
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Support fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    {user?.first_name} {user?.last_name}
                  </Typography>
                  <Chip
                    icon={isConnected ? <CheckCircle /> : <Cancel />}
                    label={isConnected ? 'Conectado' : 'Desconectado'}
                    color={isConnected ? 'success' : 'error'}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Stack>
            </Box>
          
          <Stack direction="row" spacing={3}>
            <Card sx={{ minWidth: 100, textAlign: 'center' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {stats.queueLength}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  En Cola
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 100, textAlign: 'center' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="error" fontWeight="bold">
                  {stats.urgentCalls}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Urgentes
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 100, textAlign: 'center' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {stats.activeCallsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Activas
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          <IconButton onClick={handleRefresh} sx={{ color: 'white' }} disabled={refreshing}>
            {refreshing ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <Refresh />}
          </IconButton>
        </Stack>
      </Paper>

      {/* Notificaciones */}
      {notifications.length > 0 && (
        <Stack spacing={1} sx={{ mb: 3 }}>
          {notifications.slice(0, 3).map(notification => (
            <Alert key={notification.id} severity={notification.type || 'info'}>
              {notification.message}
            </Alert>
          ))}
        </Stack>
      )}

      {/* Contenido Principal con Tabs */}
      <Card elevation={6} sx={{ borderRadius: 4, mb: 4 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
              <Support fontSize="large" />
            </Avatar>
          }
          title="Portal de Acompañamiento"
          subheader="Gestiona la cola de solicitudes y ve el historial de sesiones"
        />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTab} 
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ px: 3 }}
          >
            <Tab 
              icon={<PhoneInTalk />} 
              label="Cola de Solicitudes" 
              iconPosition="start" 
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              icon={<History />} 
              label="Historial & Estadísticas" 
              iconPosition="start" 
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        <CardContent>
          {/* Tab 1: Cola de Solicitudes */}
          {selectedTab === 0 && (
            <Box>
              <Grid container spacing={4}>
                {/* Sección de Cola */}
                <Grid item xs={12} lg={8}>
                  <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Queue color="primary" fontSize="large" />
                        <Typography variant="h5" color="primary" fontWeight={600}>
                          Solicitudes de Acompañamiento
                        </Typography>
                        <Badge badgeContent={filteredQueue.length} color="primary" />
                      </Stack>
                
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                      value={selectedPriority}
                      label="Prioridad"
                      onChange={(e) => setSelectedPriority(e.target.value)}
                    >
                      <MenuItem value="all">Todas las prioridades</MenuItem>
                      <MenuItem value="1">Urgente</MenuItem>
                      <MenuItem value="2">Normal</MenuItem>
                      <MenuItem value="3">Rutina</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    onClick={handleNextCall}
                    disabled={queueEntries.length === 0 || refreshing}
                    startIcon={<VideoCall />}
                    size="large"
                  >
                    Acompañar Siguiente
                  </Button>
                </Stack>
              </Stack>

              {queueError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  Error al cargar la cola: {queueError}
                  <Button onClick={handleRefresh} size="small" sx={{ ml: 2 }}>
                    Reintentar
                  </Button>
                </Alert>
              )}

              {queueLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : filteredQueue.length > 0 ? (
                <List>
                  {filteredQueue.map((entry, index) => (
                    <React.Fragment key={entry.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, '&:hover': { bgcolor: 'grey.50' }, borderRadius: 1 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonOutline />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle1" fontWeight={500}>
                                {entry.patientName || `Usuario ${entry.id}`}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={getPriorityLabel(entry.priority)}
                                  color={getPriorityColor(entry.priority)}
                                  size="small"
                                  icon={entry.priority === 1 ? <Warning /> : <PriorityHigh />}
                                />
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Phone />}
                                  onClick={() => handleSpecificCall(entry.id)}
                                >
                                  Llamar
                                </Button>
                              </Stack>
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <AccessTime fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Esperando: {formatWaitTime(entry.joinedAt)}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                  Posición: #{entry.position || index + 1}
                                </Typography>
                              </Stack>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredQueue.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Queue sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {selectedPriority === 'all' 
                      ? 'No hay solicitudes de acompañamiento en cola' 
                      : `No hay solicitudes con prioridad ${getPriorityLabel(parseInt(selectedPriority))}`
                    }
                  </Typography>
                </Box>
              )}
                  </Paper>
                </Grid>

                {/* Sección de Llamadas Activas */}
                <Grid item xs={12} lg={4}>
                  <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Groups color="success" fontSize="large" />
                      <Typography variant="h5" color="success.main" fontWeight={600}>
                        Sesiones Activas
                      </Typography>
                      <Badge badgeContent={activeCalls.length} color="success" />
                    </Stack>

              {activeCalls.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Groups sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No hay sesiones activas
                  </Typography>
                </Box>
              ) : (
                <List>
                  {activeCalls.map((call, index) => (
                    <React.Fragment key={call.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'success.main' }}>
                            <VideoCall />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight={500}>
                              {call.patientName || `Sesión ${call.id}`}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Acompañante: {call.employeeName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Duración: {formatWaitTime(call.startedAt)}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<PlayArrow />}
                                onClick={() => navigate(`/video-call/${call.id}`)}
                                sx={{ mt: 1 }}
                              >
                                Unirse
                              </Button>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < activeCalls.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 2: Historial & Estadísticas */}
          {selectedTab === 1 && (
            <Box>
              <Grid container spacing={4}>
                {/* Panel Izquierdo - Estadísticas */}
                {/* <Grid item xs={12} lg={8}>
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <History color="primary" />
                      Estadísticas del Portal
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary" fontWeight="bold">
                            {stats.queueLength}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            En Cola
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="error" fontWeight="bold">
                            {stats.urgentCalls}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Urgentes
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="success.main" fontWeight="bold">
                            {stats.activeCallsCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Activas
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="secondary" fontWeight="bold">
                            24/7
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Disponible
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    <Alert severity="info" sx={{ mt: 3 }}>
                      <Typography variant="body2">
                        Como acompañante profesional, tu rol es brindar apoyo emocional y estar presente 
                        durante los procedimientos médicos de los usuarios que solicitan acompañamiento.
                      </Typography>
                    </Alert>
                  </Paper>
                </Grid> */}

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
                          <Avatar sx={{ bgcolor: 'primary.light', width: 50, height: 50, mx: 'auto', mb: 2 }}>
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
                              • Compartir con supervisores
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
                          <Avatar sx={{ bgcolor: 'secondary.light', width: 50, height: 50, mx: 'auto', mb: 2 }}>
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
                              • Notas de acompañamiento
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
    </Container>
    </>
  );
};