import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useAuthStore } from '../../stores/authStore';

export const VideoRoom = ({
  token,
  serverUrl,
  callId,
  userRole,
  onDisconnected,
}) => {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="video-room-container">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        options={{
          adaptiveStream: { pixelDensity: 'screen' },
          dynacast: true,
          publishDefaults: {
            videoSimulcastLayers: [
              { resolution: { width: 640, height: 360 }, encoding: { maxBitrate: 200_000 } },
              { resolution: { width: 1280, height: 720 }, encoding: { maxBitrate: 500_000 } },
            ],
          },
        }}
        onConnected={() => setIsConnected(true)}
        onDisconnected={onDisconnected}
      >
        <div className="video-content">
          {userRole === 'family' ? (
            <SilentObserverView />
          ) : (
            <ActiveParticipantView userRole={userRole} />
          )}
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

// Componente para observadores silenciosos (familiares)
const SilentObserverView = () => {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });

  return (
    <div className="silent-observer" role="region" aria-label="Live video stream">
      <div className="observer-header">
        <p className="text-sm text-gray-600">
          Visualizando consulta médica - Modo observador
        </p>
      </div>
      <div className="video-grid">
        {tracks.map((track, index) => (
          <ParticipantTile
            key={index}
            trackRef={track}
            className="observer-tile"
          />
        ))}
      </div>
      <p className="sr-only">
        Está visualizando una consulta médica en vivo en modo observador
      </p>
    </div>
  );
};

// Componente para participantes activos
const ActiveParticipantView = ({ userRole }) => {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });

  return (
    <div className="active-participant">
      <GridLayout tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
      
      {(userRole === 'employee' || userRole === 'admin') && (
        <div className="call-controls">
          <ControlBar
            controls={{
              camera: true,
              microphone: true,
              screenShare: true,
              chat: true,
            }}
          />
          <RecordingControls />
        </div>
      )}
    </div>
  );
};

// Controles de grabación
const RecordingControls = () => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = async () => {
    try {
      const endpoint = isRecording ? '/api/calls/stop-recording' : '/api/calls/start-recording';
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Error toggling recording:', error);
    }
  };

  return (
    <button
      onClick={toggleRecording}
      className={`recording-btn ${isRecording ? 'recording' : ''}`}
      aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
    >
      <div className={`recording-indicator ${isRecording ? 'active' : ''}`} />
      {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
    </button>
  );
};