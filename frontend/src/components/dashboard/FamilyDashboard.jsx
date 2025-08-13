import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

export const FamilyDashboard = () => {
  const [activeCall, setActiveCall] = useState(null);
  const [canObserve, setCanObserve] = useState(false);

  const checkObserverAccess = async () => {
    try {
      const response = await fetch('/api/family/observer-access', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      
      const data = await response.json();
      setCanObserve(data.can_observe);
      setActiveCall(data.active_call);
    } catch (error) {
      console.error('Error checking observer access:', error);
    }
  };

  useEffect(() => {
    checkObserverAccess();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkObserverAccess, 30000);
    return () => clearInterval(interval);
  }, []);

  const joinAsObserver = () => {
    if (activeCall) {
      window.location.href = `/call/${activeCall.id}?mode=observer`;
    }
  };

  return (
    <div className="family-dashboard">
      <header className="dashboard-header">
        <h1>Panel Familiar</h1>
      </header>

      <div className="dashboard-content">
        {canObserve && activeCall ? (
          <div className="observer-access-section">
            <div className="active-call-card">
              <h2>Consulta en Progreso</h2>
              <p>Su familiar está actualmente en una videollamada médica.</p>
              <div className="call-details">
                <p><strong>Iniciada:</strong> {new Date(activeCall.startedAt).toLocaleTimeString()}</p>
                <p><strong>Estado:</strong> Activa</p>
              </div>
              <button
                onClick={joinAsObserver}
                className="join-observer-btn"
              >
                Observar Consulta
              </button>
              <p className="observer-note">
                <small>
                  Podrá ver y escuchar la consulta sin que los participantes lo sepan.
                  Esta función está habilitada por razones de seguridad.
                </small>
              </p>
            </div>
          </div>
        ) : (
          <div className="no-active-call">
            <div className="status-card">
              <h2>Sin Consultas Activas</h2>
              <p>No hay consultas médicas en progreso en este momento.</p>
            </div>
          </div>
        )}

        <div className="call-history-section">
          <h2>Historial de Consultas Observadas</h2>
          <ObservedCallsList />
        </div>
      </div>
    </div>
  );
};

// Lista de llamadas observadas
const ObservedCallsList = () => {
  const [observedCalls, setObservedCalls] = useState([]);

  useEffect(() => {
    fetchObservedCalls();
  }, []);

  const fetchObservedCalls = async () => {
    try {
      const response = await fetch('/api/family/observed-calls', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
        },
      });
      const calls = await response.json();
      setObservedCalls(calls);
    } catch (error) {
      console.error('Error fetching observed calls:', error);
    }
  };

  return (
    <div className="observed-calls-list">
      {observedCalls.map((call) => (
        <div key={call.id} className="observed-call-item">
          <div className="call-info">
            <p className="call-date">
              {new Date(call.startedAt).toLocaleDateString()}
            </p>
            <p className="call-duration">
              Duración: {call.duration} minutos
            </p>
          </div>
          {call.recordingUrl && (
            <button className="view-recording-btn">
              Ver Grabación
            </button>
          )}
        </div>
      ))}
      {observedCalls.length === 0 && (
        <p className="no-observed">No hay consultas observadas</p>
      )}
    </div>
  );
};