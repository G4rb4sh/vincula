import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Tabs,
  Tab,
  Divider,
  Button,
} from '@mui/material';
import {
  LiveTv,
  VideoLibrary,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { LiveCallsList } from '../calls/LiveCallsList';

export const FamilyDashboard = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const { user } = useAuthStore();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Encabezado */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Dashboard Familiar
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Bienvenido, {user?.first_name || 'Usuario'}. Aquí puedes ver las videollamadas de tus familiares en tiempo real.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Tabs de navegación */}
        <Paper elevation={1}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<LiveTv />}
              label="Llamadas en Vivo"
              iconPosition="start"
            />
            <Tab
              icon={<VideoLibrary />}
              label="Grabaciones"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Contenido según tab seleccionado */}
        <Box>
          {currentTab === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Paper elevation={2} sx={{ p: 3 }}>
                <Stack spacing={2} mb={3}>
                  <Typography variant="h5" component="h2">
                    Videollamadas en Curso
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aquí aparecerán las videollamadas activas de tus familiares. Puedes unirte como observador
                    en cualquier momento sin interrumpir la consulta médica. Todas las sesiones se graban automáticamente.
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />
                <LiveCallsList userRole="family" showOnlyFamily={true} />
              </Paper>
            </motion.div>
          )}

          {currentTab === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Paper elevation={2} sx={{ p: 3 }}>
                <Stack spacing={2} mb={3}>
                  <Typography variant="h5" component="h2">
                    Historial de Grabaciones
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Todas las consultas médicas se graban automáticamente. Aquí puedes acceder 
                    a todas las grabaciones para revisar la información médica cuando lo necesites.
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 3 }} />
                <RecordingsList />
              </Paper>
            </motion.div>
          )}
        </Box>
      </Stack>
    </Container>
  );
};

// Lista de grabaciones de llamadas
const RecordingsList = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await fetch('/api/v1/calls/recordings', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'X-User-ID': user.id,
          'X-User-Role': user.role,
        },
      });
      const data = await response.json();
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography>Cargando grabaciones...</Typography>
      </Box>
    );
  }

  if (recordings.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay grabaciones disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Las grabaciones de las consultas aparecerán aquí
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {recordings.map((recording) => (
        <Paper
          key={recording.id}
          elevation={1}
          sx={{
            p: 2,
            '&:hover': {
              boxShadow: 3,
              transition: 'box-shadow 0.3s',
            },
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Grabación - {new Date(recording.created_at).toLocaleDateString()}
              </Typography>
              <Stack direction="row" spacing={2} mt={1}>
                <Typography variant="body2" color="text.secondary">
                  Duración: {formatDuration(recording.duration_seconds)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamaño: {formatFileSize(recording.recording_size_bytes)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(recording.created_at).toLocaleTimeString()}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<VideoLibrary />}
                onClick={() => window.open(recording.recording_url, '_blank')}
              >
                Ver Grabación
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
};