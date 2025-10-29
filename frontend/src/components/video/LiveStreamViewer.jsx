import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  GridLayout,
  useTracks,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Stack,
  Chip,
  Alert,
  Button,
  Tooltip,
  Badge,
  AppBar,
  Toolbar,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Close,
  RadioButtonChecked,
  Group,
  AccessTime,
  LiveTv,
  Info,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

// Componente principal del visor de livestream
export const LiveStreamViewer = () => {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callInfo, setCallInfo] = useState(null);
  const containerRef = useRef(null);

  // Obtener token de observador
  useEffect(() => {
    const fetchObserverToken = async () => {
      try {
        const response = await fetch(`/api/v1/calls/${callId}/livestream-token`, {
          headers: {
            'Authorization': `Bearer ${useAuthStore.getState().token}`,
            'X-User-ID': user.id,
            'X-User-Role': user.role,
          },
        });

        if (!response.ok) {
          throw new Error('No autorizado para ver esta llamada');
        }

        const data = await response.json();
        setToken(data.token);
        setServerUrl(data.serverUrl);
        
        // Obtener información de la llamada
        fetchCallInfo();
      } catch (err) {
        console.error('Error getting observer token:', err);
        setError(err.message || 'Error al conectar con la transmisión');
      } finally {
        setLoading(false);
      }
    };

    fetchObserverToken();
  }, [callId, user]);

  // Obtener información de la llamada
  const fetchCallInfo = async () => {
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCallInfo(data.call);
      }
    } catch (err) {
      console.error('Error fetching call info:', err);
    }
  };

  // Manejar pantalla completa
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Salir del visor
  const handleExit = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
          <Typography variant="h6" gutterBottom>
            Conectando con la transmisión...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={handleExit}>
            Volver
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box ref={containerRef} sx={{ height: '100vh', bgcolor: 'background.default' }}>
      {/* Barra superior con información */}
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <Badge
              badgeContent={<RadioButtonChecked sx={{ fontSize: 10 }} />}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                    '100%': { opacity: 1 },
                  },
                },
              }}
            >
              <LiveTv color="primary" />
            </Badge>
            
            <Typography variant="h6" component="h1">
              Transmisión en Vivo
            </Typography>
            
            <Chip
              icon={<Visibility />}
              label="Modo Observador"
              color="info"
              size="small"
            />
            
            {callInfo && (
              <>
                <Chip
                  icon={<Group />}
                  label={`Paciente: ${callInfo.patient_name}`}
                  size="small"
                  variant="outlined"
                />
                {callInfo.employee_name && (
                  <Chip
                    label={`Médico: ${callInfo.employee_name}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </>
            )}
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title={audioEnabled ? 'Silenciar' : 'Activar audio'}>
              <IconButton onClick={() => setAudioEnabled(!audioEnabled)}>
                {audioEnabled ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
              <IconButton onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Salir">
              <IconButton onClick={handleExit} color="error">
                <Close />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Contenedor del video */}
      <Box sx={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
        {token && serverUrl && (
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={false} // Observadores no publican audio
            video={false} // Observadores no publican video
            options={{
              adaptiveStream: true,
              dynacast: true,
            }}
            onConnected={() => setIsConnected(true)}
            onDisconnected={() => {
              setIsConnected(false);
              navigate(-1);
            }}
          >
            <ObserverView audioEnabled={audioEnabled} />
            <RoomAudioRenderer volume={audioEnabled ? 1 : 0} />
          </LiveKitRoom>
        )}

        {/* Overlay con información */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            p: 2,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            maxWidth: 300,
          }}
        >
          <Stack spacing={1}>
            <Typography variant="body2">
              <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Estás viendo esta llamada en modo observador
            </Typography>
            <Typography variant="caption">
              • No puedes hablar ni ser visto
            </Typography>
            <Typography variant="caption">
              • Solo puedes observar y escuchar
            </Typography>
            <Typography variant="caption">
              • La sesión se está grabando automáticamente
            </Typography>
          </Stack>
        </Paper>

        {/* Indicador de conexión */}
        {!isConnected && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Conectando...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Componente interno para la vista del observador
const ObserverView = ({ audioEnabled }) => {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });
  const participants = useParticipants();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'speaker'
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Actualizar duración cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Formatear duración
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ height: '100%', position: 'relative', bgcolor: '#000' }}>
      {/* Vista principal de video */}
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tracks.length > 0 ? (
          <GridLayout tracks={tracks}>
            <ParticipantTile />
          </GridLayout>
        ) : (
          <Typography variant="h6" color="text.secondary">
            Esperando participantes...
          </Typography>
        )}
      </Box>

      {/* Información de la transmisión */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <Chip
          icon={<RadioButtonChecked />}
          label="EN VIVO"
          color="error"
          size="small"
          sx={{
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.6 },
              '100%': { opacity: 1 },
            },
          }}
        />
        
        <Chip
          icon={<AccessTime />}
          label={formatDuration(duration)}
          size="small"
          sx={{ bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white' }}
        />
        
        <Chip
          icon={<Group />}
          label={`${participants.length} participantes`}
          size="small"
          sx={{ bgcolor: 'rgba(0, 0, 0, 0.5)', color: 'white' }}
        />
      </Box>

      {/* Control de vista */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
            sx={{
              bgcolor: viewMode === 'grid' ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            Vista Cuadrícula
          </Button>
          <Button
            size="small"
            variant={viewMode === 'speaker' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('speaker')}
            sx={{
              bgcolor: viewMode === 'speaker' ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            Vista Hablante
          </Button>
        </Stack>
      </Box>

      {/* Indicador de audio desactivado */}
      {!audioEnabled && (
        <Chip
          icon={<VolumeOff />}
          label="Audio silenciado"
          size="small"
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
          }}
        />
      )}
    </Box>
  );
};

export default LiveStreamViewer;

