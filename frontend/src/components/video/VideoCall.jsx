import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Room, 
  RoomEvent,
  Track,
  setLogLevel,
  LogLevel,
} from 'livekit-client';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Stack,
  Button,
  Container,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PeopleIcon from '@mui/icons-material/People';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import { useAuthStore } from '../../stores/authStore';
import { useCallStore } from '../../stores/callStore';
import { apiRequest } from '../../utils/api';
import './VideoCall.css';

function VideoCall() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCurrentCall } = useCallStore();
  
  // Estados del componente
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callInfo, setCallInfo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Referencias para elementos de video y control de conexión
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const remoteAudioRefs = useRef({});
  const roomRef = useRef(null);
  const isConnectingRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const connectAttemptRef = useRef(0);
  const mountTimeRef = useRef(Date.now());

  // Obtener información de la llamada
  const fetchCallInfo = useCallback(async () => {
    try {
      const response = await apiRequest(`/api/calls/${callId}`);
      setCallInfo(response.call);
      setIsRecording(response.call.isRecording);
      setCurrentCall(response.call);
    } catch (error) {
      console.error('Error fetching call info:', error);
      setError('No se pudo obtener la información de la llamada');
    }
  }, [callId, setCurrentCall]);

  // Obtener token de Livekit
  const getLivekitToken = async () => {
    try {
      const response = await apiRequest('/api/calls/token', {
        method: 'POST',
        body: JSON.stringify({
          call_id: callId,
          participant_id: user.id,
          role: user.role,
          is_observer: false
        })
      });
      return { token: response.token, serverUrl: response.server_url };
    } catch (error) {
      console.error('Error getting Livekit token:', error);
      throw new Error('No se pudo obtener el token de acceso');
    }
  };

  // Conectar a la sala de Livekit
  const connectToRoom = async () => {
    // Evitar múltiples intentos simultáneos o reconexiones innecesarias
    if (isConnectingRef.current || hasConnectedRef.current || roomRef.current) {
      console.log('Already connecting/connected, skipping connectToRoom');
      return;
    }
    isConnectingRef.current = true;
    const attemptId = Date.now();
    connectAttemptRef.current = attemptId;
    try {
      setIsLoading(true);
      setError(null);

      // Obtener token
      const { token, serverUrl } = await getLivekitToken();
      
      // Crear y configurar sala
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoEncoding: {
            maxBitrate: 1_500_000,
            maxFramerate: 30,
          },
        },
      });

      // Configurar event listeners
      newRoom.on(RoomEvent.Connected, () => {
        if (connectAttemptRef.current !== attemptId) {
          // Evento de una conexión antigua, ignorar
          return;
        }
        console.log('Connected to room');
        setIsConnected(true);
        setIsLoading(false);
        hasConnectedRef.current = true;
        isConnectingRef.current = false;
        // Sembrar participantes existentes al conectar (para ver a quien ya estaba)
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to room...');
        setIsConnected(false);
        // No marcar error aquí; es transitorio
      });

      newRoom.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to room');
        setIsConnected(true);
        setError(null);
      });

      newRoom.on(RoomEvent.Disconnected, (reason) => {
        if (connectAttemptRef.current !== attemptId) {
          return;
        }
        console.log('Disconnected from room:', reason);
        setIsConnected(false);
        hasConnectedRef.current = false;
        isConnectingRef.current = false;
        // No forzar error en códigos numéricos transitorios
        if (reason !== 'CLIENT_INITIATED' && typeof reason !== 'number') {
          setError('Se perdió la conexión con la videollamada');
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
        updateParticipants(newRoom);
        try {
          // Forzar suscripción a publicaciones existentes por posibles race conditions
          const pubs = Array.from(participant.videoTrackPublications?.values?.() || []);
          pubs.forEach((pub) => {
            if (typeof pub.setSubscribed === 'function') {
              pub.setSubscribed(true).catch(() => {});
            }
          });
        } catch (_) {}
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, participant.identity);
        if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
          attachTrackToElement(track, participant);
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, participant.identity);
        detachTrackFromElement(track, participant);
      });

      newRoom.on(RoomEvent.TrackPublished, (publication, participant) => {
        // Asegurar suscripción inmediata al publicarse
        try {
          if (typeof publication.setSubscribed === 'function') {
            publication.setSubscribed(true).catch(() => {});
          }
        } catch (_) {}
      });

      newRoom.on(RoomEvent.TrackSubscriptionFailed, (trackSid, participant) => {
        console.warn('Track subscription failed for', trackSid, 'participant', participant?.identity);
      });

      // Conectar a la sala (usar URL provista por backend si existe)
      const urlToUse = serverUrl || process.env.REACT_APP_LIVEKIT_URL || 'ws://localhost:7880';
      // No publicar audio/video durante la conexión para evitar bloqueo por autoplay
      await newRoom.connect(urlToUse, token, {
        autoSubscribe: true,
        audio: false,
        video: false,
      });
      
      setRoom(newRoom);
      roomRef.current = newRoom;
      // Asegurar que la lista de participantes se actualice inmediatamente tras conectar
      updateParticipants(newRoom);

      // Capturar referencias a las pistas locales ya publicadas
      try {
        const videoTrack = newRoom.localParticipant.videoTrackPublications.values().next().value?.track;
        const audioTrack = newRoom.localParticipant.audioTrackPublications.values().next().value?.track;
        setLocalTracks({ video: videoTrack || null, audio: audioTrack || null });
        if (videoTrack && localVideoRef.current) {
          videoTrack.attach(localVideoRef.current);
        }
      } catch (pubRefErr) {
        console.warn('Failed to capture local tracks after connect:', pubRefErr);
      }

    } catch (error) {
      // Si hubo un error pero la sala llegó a conectarse (reintentos internos), ignorarlo
      if (hasConnectedRef.current || (roomRef.current && roomRef.current.state === 2)) {
        console.warn('Transient connect error ignored after successful connection:', error);
        setIsLoading(false);
      } else {
        console.error('Error connecting to room:', error);
        setError(error.message || 'Error al conectar con la videollamada');
        setIsLoading(false);
      }
      isConnectingRef.current = false;
    }
  };

  // Actualizar lista de participantes
  const updateParticipants = (room) => {
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    setParticipants(remoteParticipants);
    try {
      console.log('Remote participants count:', remoteParticipants.length, remoteParticipants.map(p => ({ id: p.identity, sid: p.sid, name: p.name })));
    } catch (_) {}
    // Adjuntar inmediatamente tracks existentes a sus elementos si ya están montados
    try {
      remoteParticipants.forEach((p) => {
        const el = remoteVideoRefs.current[p.identity];
        if (!el) return;
        const pubs = Array.from(p.videoTrackPublications?.values?.() || []);
        const existingTrack = pubs.find((pub) => pub?.track)?.track;
        if (existingTrack) {
          existingTrack.attach(el);
          el.play && el.play().catch(() => {});
        }
      });
    } catch (_) {}
  };

  // Publicar pistas locales
  const publishLocalTracks = async (room) => {
    try {
      // Obtener pistas de cámara y micrófono
      await room.localParticipant.enableCameraAndMicrophone();
      
      // Obtener referencias a las pistas
      const videoTrack = room.localParticipant.videoTrackPublications.values().next().value?.track;
      const audioTrack = room.localParticipant.audioTrackPublications.values().next().value?.track;
      
      setLocalTracks({
        video: videoTrack,
        audio: audioTrack
      });

      // Adjuntar video local
      if (videoTrack && localVideoRef.current) {
        videoTrack.attach(localVideoRef.current);
      }

    } catch (error) {
      console.error('Error publishing local tracks:', error);
      setError('Error al acceder a la cámara o micrófono');
    }
  };

  // Habilitar audio (desbloquear autoplay) y publicar dispositivos bajo gesto del usuario
  const enableAudioAndDevices = async () => {
    const activeRoom = roomRef.current || room;
    if (!activeRoom) return;
    try {
      if (typeof activeRoom.startAudio === 'function') {
        const started = await activeRoom.startAudio();
        if (started) {
          setAudioUnlocked(true);
        }
      } else {
        setAudioUnlocked(true);
      }
      if (user.role !== 'family') {
        await publishLocalTracks(activeRoom);
      }
    } catch (e) {
      console.error('Failed to enable audio/devices:', e);
    }
  };

  // Adjuntar pista a elemento de video
  const attachTrackToElement = (track, participant) => {
    if (track.kind === Track.Kind.Video) {
      const element = remoteVideoRefs.current[participant.identity];
      if (element) {
        track.attach(element);
        try {
          element.play && element.play().catch(() => {});
        } catch (_) {}
      }
    } else if (track.kind === Track.Kind.Audio) {
      try {
        const audioEl = track.attach();
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        audioEl.muted = !audioUnlocked;
        remoteAudioRefs.current[participant.identity] = audioEl;
        document.body.appendChild(audioEl);
        audioEl.play && audioEl.play().catch(() => {});
      } catch (_) {}
    }
  };

  // Desadjuntar pista de elemento
  const detachTrackFromElement = (track, participant) => {
    if (track.kind === Track.Kind.Video) {
      track.detach();
    } else if (track.kind === Track.Kind.Audio) {
      try {
        const el = remoteAudioRefs.current[participant.identity];
        if (el) {
          track.detach(el);
          el.remove();
          delete remoteAudioRefs.current[participant.identity];
        } else {
          track.detach();
        }
      } catch (_) {}
    }
  };

  // Alternar micrófono
  const toggleMicrophone = async () => {
    if (!roomRef.current) return;
    const activeRoom = roomRef.current;
    if (!localTracks.audio) {
      await publishLocalTracks(activeRoom);
    }
    if (localTracks.audio) {
      const enabled = !isMuted;
      await activeRoom.localParticipant.setMicrophoneEnabled(enabled);
      setIsMuted(!enabled);
    }
  };

  // Alternar cámara
  const toggleCamera = async () => {
    if (!roomRef.current) return;
    const activeRoom = roomRef.current;
    if (!localTracks.video) {
      await publishLocalTracks(activeRoom);
    }
    if (localTracks.video) {
      const enabled = !isVideoEnabled;
      await activeRoom.localParticipant.setCameraEnabled(enabled);
      setIsVideoEnabled(enabled);
    }
  };

  // Finalizar llamada
  const endCall = async () => {
    try {
      if (room) {
        await room.disconnect();
      }
      
      // Notificar al backend
      await apiRequest(`/api/calls/${callId}/end`, {
        method: 'POST'
      });
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending call:', error);
      // Redirigir de todas formas
      navigate('/dashboard');
    }
  };

  // Efecto para inicializar la llamada
  useEffect(() => {
    // Enable verbose LiveKit logs in development
    if (process.env.NODE_ENV !== 'production') {
      try { setLogLevel(LogLevel.debug); } catch (_) {}
    }

    if (callId && user) {
      fetchCallInfo();
      connectToRoom();
    }

    // Cleanup al desmontar
    return () => {
      const r = roomRef.current || room;
      // In development, React StrictMode runs effects twice. Avoid tearing down
      // the live connection immediately during the test unmount.
      const isDev = process.env.NODE_ENV !== 'production';
      const elapsedMs = Date.now() - mountTimeRef.current;
      const shouldSkipDevCleanup = isDev && elapsedMs < 3000;
      if (!shouldSkipDevCleanup && r) {
        try { r.disconnect(); } catch (_) {}
      }
      roomRef.current = null;
      hasConnectedRef.current = false;
      isConnectingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="video-call-loading">
        <div className="loading-spinner"></div>
        <p>Conectando a la videollamada...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="video-call-error">
        <h2>Error en la Videollamada</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Calcular distribución de grid tipo Meet según cantidad de tiles
  const totalTiles = participants.length + (user.role !== 'family' ? 1 : 0);
  let gridCols = '1fr';
  if (totalTiles === 2) gridCols = 'repeat(2, 1fr)';
  else if (totalTiles === 3 || totalTiles === 4) gridCols = 'repeat(2, 1fr)';
  else if (totalTiles >= 5 && totalTiles <= 9) gridCols = 'repeat(3, 1fr)';
  else if (totalTiles >= 10) gridCols = 'repeat(4, 1fr)';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0b0f14' }}>
      <AppBar position="static" color="default" sx={{ bgcolor: '#111827', color: '#e5e7eb', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Videollamada</Typography>
            {callInfo && (
              <Chip size="small" label={`ID: ${callInfo.id}`} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }} />
            )}
            <Chip size="small" icon={<SignalCellularAltIcon sx={{ color: isConnected ? '#22c55e' : '#f59e0b' }} />} label={isConnected ? 'Conectado' : 'Conectando...'} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: isConnected ? '#22c55e' : '#f59e0b' }} />
            {isRecording && (
              <Chip size="small" icon={<FiberManualRecordIcon sx={{ color: '#ef4444' }} />} label="Grabando" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#fecaca' }} />
            )}
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip size="small" icon={<PeopleIcon sx={{ color: '#9ca3af' }} />} label={`${participants.length + (user.role !== 'family' ? 1 : 0)} participantes`} sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }} />
            <Button onClick={endCall} variant="contained" color="error" startIcon={<CallEndIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>Salir</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} disableGutters sx={{ flex: 1, py: 2 }}>
        <Box sx={{ position: 'relative', height: '100%' }}>
          {isConnected && !audioUnlocked && (
            <Box sx={{ position: 'absolute', zIndex: 20, top: 16, left: '50%', transform: 'translateX(-50%)' }}>
              <Button variant="contained" color="primary" onClick={enableAudioAndDevices}>Habilitar audio y dispositivos</Button>
            </Box>
          )}

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              height: '100%',
              gridTemplateColumns: gridCols,
              placeContent: 'center start',
              justifyItems: 'center',
              alignItems: 'start',
              overflow: 'auto',
            }}
          >
            {/* Remotos */}
            {participants.map((participant) => (
              <Paper key={participant.identity} elevation={0} sx={{ bgcolor: '#111827', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', width: '100%' }}>
                <Box sx={{
                  position: 'relative',
                  width: 'min(100%, calc(80vh * 16 / 9))',
                  aspectRatio: '16 / 9',
                  maxHeight: '80vh',
                  mx: 'auto',
                }}>
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current[participant.identity] = el;
                        try {
                          const pubs = Array.from(participant.videoTrackPublications?.values?.() || []);
                          const existingTrack = pubs.find((p) => p?.track)?.track;
                          if (existingTrack) {
                            existingTrack.attach(el);
                            el.play && el.play().catch(() => {});
                          }
                        } catch (_) {}
                      }
                    }}
                    autoPlay
                    muted={!audioUnlocked}
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#0b0f14' }}
                  />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.5)', px: 1.25, py: 0.5, borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#e5e7eb' }}>{participant.name || participant.identity}</Typography>
                </Box>
              </Paper>
            ))}

            {/* Local */}
            {user.role !== 'family' && (
              <Paper elevation={0} sx={{ bgcolor: '#111827', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', width: '100%' }}>
                <Box sx={{
                  position: 'relative',
                  width: 'min(100%, calc(80vh * 16 / 9))',
                  aspectRatio: '16 / 9',
                  maxHeight: '80vh',
                  mx: 'auto',
                }}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#0b0f14' }}
                  />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.5)', px: 1.25, py: 0.5, borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#e5e7eb' }}>Tú</Typography>
                </Box>
              </Paper>
            )}

            {participants.length === 0 && (
              <Box sx={{ gridColumn: '1 / -1', minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <Typography>Esperando a que se unan otros participantes...</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      {/* Barra de controles inferior */}
      <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(6px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth={false}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ py: 1.5 }}>
            <Tooltip title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}>
              <IconButton onClick={toggleMicrophone} sx={{ bgcolor: isMuted ? '#7f1d1d' : '#1f2937', color: isMuted ? '#fecaca' : '#e5e7eb', '&:hover': { bgcolor: isMuted ? '#991b1b' : '#374151' } }}>
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isVideoEnabled ? 'Desactivar cámara' : 'Activar cámara'}>
              <IconButton onClick={toggleCamera} sx={{ bgcolor: !isVideoEnabled ? '#7f1d1d' : '#1f2937', color: !isVideoEnabled ? '#fecaca' : '#e5e7eb', '&:hover': { bgcolor: !isVideoEnabled ? '#991b1b' : '#374151' } }}>
                {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Finalizar llamada">
              <IconButton onClick={endCall} sx={{ bgcolor: '#dc2626', color: '#fff', '&:hover': { bgcolor: '#b91c1c' } }}>
                <CallEndIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default VideoCall;