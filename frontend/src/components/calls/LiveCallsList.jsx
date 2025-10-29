import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Videocam,
  RadioButtonChecked,
  Person,
  Group,
  Visibility,
  AccessTime,
  PriorityHigh,
  LiveTv,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { apiRequest } from '../../utils/api';

export const LiveCallsList = ({ userRole, showOnlyFamily = false }) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Obtener llamadas activas
  const fetchActiveCalls = async () => {
    try {
      setError(null);
      const response = await apiRequest('/api/v1/calls/active', {
        headers: {
          'X-User-ID': user.id,
          'X-User-Role': user.role,
        },
      });
      setCalls(response.calls || []);
    } catch (err) {
      console.error('Error fetching active calls:', err);
      setError('No se pudieron cargar las llamadas activas');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar llamadas periódicamente
  useEffect(() => {
    fetchActiveCalls();
    
    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      fetchActiveCalls();
    }, 10000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Unirse como observador a una llamada
  const handleJoinAsObserver = async (callId) => {
    try {
      const response = await apiRequest(`/api/v1/calls/${callId}/livestream-token`, {
        headers: {
          'X-User-ID': user.id,
          'X-User-Role': user.role,
        },
      });
      
      // Navegar a la sala de video con el token de observador
      navigate(`/video-call/${callId}`, {
        state: {
          token: response.token,
          serverUrl: response.serverUrl,
          mode: 'observer',
        },
      });
    } catch (err) {
      console.error('Error joining call as observer:', err);
      alert('No se pudo unir a la llamada');
    }
  };

  // Obtener color según prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 3: return 'error';
      case 2: return 'warning';
      case 1: return 'info';
      default: return 'default';
    }
  };

  // Obtener label de prioridad
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 3: return 'Alta';
      case 2: return 'Media';
      case 1: return 'Baja';
      default: return 'Normal';
    }
  };

  // Calcular duración
  const getCallDuration = (startedAt) => {
    if (!startedAt) return '0:00';
    
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (calls.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <LiveTv sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay llamadas activas en este momento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Las videollamadas en curso aparecerán aquí
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          <Badge badgeContent={calls.length} color="error" sx={{ mr: 2 }}>
            <LiveTv sx={{ mr: 1 }} />
          </Badge>
          Llamadas en Vivo
        </Typography>
        <Chip
          icon={<RadioButtonChecked />}
          label={`${calls.length} ${calls.length === 1 ? 'llamada activa' : 'llamadas activas'}`}
          color="error"
          variant="outlined"
        />
      </Stack>

      <Grid container spacing={3}>
        {calls.map((call) => (
          <Grid item xs={12} md={6} lg={4} key={call.id}>
            <Card
              sx={{
                height: '100%',
                position: 'relative',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s',
                },
              }}
            >
              {/* Indicador de grabación */}
              {call.is_recording && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'error.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.6 },
                      '100%': { opacity: 1 },
                    },
                  }}
                >
                  <RadioButtonChecked sx={{ fontSize: 12, mr: 0.5 }} />
                  <Typography variant="caption">REC</Typography>
                </Box>
              )}

              <CardContent>
                <Stack spacing={2}>
                  {/* Encabezado con paciente */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" component="h3">
                        {call.patient_name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={call.status === 'active' ? 'En curso' : 'En espera'}
                          color={call.status === 'active' ? 'success' : 'warning'}
                        />
                        {call.priority > 1 && (
                          <Chip
                            size="small"
                            icon={<PriorityHigh />}
                            label={getPriorityLabel(call.priority)}
                            color={getPriorityColor(call.priority)}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>

                  {/* Información de la llamada */}
                  <Box>
                    {call.employee_name && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Médico:</strong> {call.employee_name}
                      </Typography>
                    )}
                    {call.reason && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        <strong>Motivo:</strong> {call.reason}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={2} mt={1}>
                      <Typography variant="body2" color="text.secondary">
                        <AccessTime sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {getCallDuration(call.started_at)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <Group sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {call.participant_count} participantes
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Botones de acción */}
                  <Stack direction="row" spacing={1}>
                    {call.is_livestreaming ? (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<Visibility />}
                        onClick={() => handleJoinAsObserver(call.id)}
                      >
                        Ver en Vivo
                      </Button>
                    ) : (
                      <Tooltip title="Esta llamada no permite transmisión en vivo">
                        <span style={{ width: '100%' }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            disabled
                            startIcon={<Videocam />}
                          >
                            No disponible
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>

                  {/* Indicadores adicionales */}
                  <Stack direction="row" spacing={1}>
                    {call.is_recording && (
                      <Chip
                        size="small"
                        icon={<RadioButtonChecked />}
                        label="Grabando"
                        color="error"
                        variant="outlined"
                      />
                    )}
                    {call.is_livestreaming && (
                      <Chip
                        size="small"
                        icon={<LiveTv />}
                        label="En vivo"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Componente simplificado para mostrar solo el contador de llamadas activas
export const LiveCallsCounter = () => {
  const [callCount, setCallCount] = useState(0);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await apiRequest('/api/v1/calls/active', {
          headers: {
            'X-User-ID': user.id,
            'X-User-Role': user.role,
          },
        });
        setCallCount(response.count || 0);
      } catch (err) {
        console.error('Error fetching call count:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (callCount === 0) return null;

  return (
    <Badge badgeContent={callCount} color="error">
      <LiveTv />
    </Badge>
  );
};

export default LiveCallsList;

