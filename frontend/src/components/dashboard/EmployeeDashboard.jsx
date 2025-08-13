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
} from '@mui/icons-material';
import { useCallStore } from '../../stores/callStore';
import { useAuthStore } from '../../stores/authStore';
import { useQueueUpdates, useNotifications } from '../../hooks/useWebSocket';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
              Panel de Empleado
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PersonOutline />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Bienvenido, {user?.first_name} {user?.last_name}
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

      <Grid container spacing={4}>
        {/* Sección de Cola */}
        <Grid item xs={12} lg={8}>
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Queue color="primary" fontSize="large" />
                  <Typography variant="h5" color="primary" fontWeight={600}>
                    Cola de Pacientes
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
                    Atender Siguiente
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
                                {entry.patientName || `Paciente ${entry.id}`}
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
                      ? 'No hay pacientes en cola' 
                      : `No hay pacientes con prioridad ${getPriorityLabel(parseInt(selectedPriority))}`
                    }
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sección de Llamadas Activas */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Groups color="success" fontSize="large" />
                <Typography variant="h5" color="success.main" fontWeight={600}>
                  Llamadas Activas
                </Typography>
                <Badge badgeContent={activeCalls.length} color="success" />
              </Stack>

              {activeCalls.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Groups sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No hay llamadas activas
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
                              {call.patientName || `Llamada ${call.id}`}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Empleado: {call.employeeName}
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
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};