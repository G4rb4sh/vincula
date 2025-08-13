import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();

  useEffect(() => {
    // Verificar autenticación al cargar la página
    checkAuth();
  }, [checkAuth]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>🏥 Vincula</h1>
            </div>
            <nav className="nav-menu">
              <a href="#features">Características</a>
              <a href="#how-it-works">Cómo Funciona</a>
              <a href="#contact">Contacto</a>
              {isAuthenticated ? (
                <div className="user-menu">
                  <span className="user-greeting">
                    Hola, {user?.name || 'Usuario'}
                  </span>
                  <button onClick={handleGetStarted} className="btn-dashboard">
                    Ir al Dashboard
                  </button>
                  <button onClick={handleLogout} className="btn-logout">
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <button onClick={handleGetStarted} className="btn-login">
                  Iniciar Sesión
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              {isAuthenticated ? (
                <>
                  <h1 className="hero-title">
                    ¡Bienvenido de vuelta, {user?.name}!
                  </h1>
                  <p className="hero-subtitle">
                    Estás conectado como <strong>{getRoleLabel(user?.role)}</strong>. 
                    Accede a tu dashboard para gestionar tus consultas y conexiones.
                  </p>
                  <div className="hero-buttons">
                    <button onClick={handleGetStarted} className="btn-primary-large">
                      Ir al Dashboard
                    </button>
                    <button onClick={handleLogout} className="btn-secondary-large">
                      Cerrar Sesión
                    </button>
                  </div>
                  <div className="user-status">
                    <div className="status-card">
                      <h3>Tu información:</h3>
                      <p><strong>Nombre:</strong> {user?.name}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Rol:</strong> {getRoleLabel(user?.role)}</p>
                      <p><strong>Estado:</strong> <span className="status-active">Activo</span></p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="hero-title">
                    Conectando Corazones a Través de la Tecnología
                  </h1>
                  <p className="hero-subtitle">
                    Vincula es la plataforma de videollamadas médicas que une a doctores, 
                    pacientes y sus seres queridos en un solo lugar. Brindamos acompañamiento 
                    virtual para que nadie esté solo en momentos importantes.
                  </p>
                  <div className="hero-buttons">
                    <button onClick={() => navigate('/register')} className="btn-primary-large">
                      Crear Cuenta Gratis
                    </button>
                    <button onClick={handleGetStarted} className="btn-secondary-large">
                      Iniciar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="hero-image">
              <div className="hero-illustration">
                <div className="video-call-mockup">
                  <div className="mockup-screen">
                    <div className="participant doctor">
                      <div className="avatar">👨‍⚕️</div>
                      <span>Dr. García</span>
                    </div>
                    <div className="participant patient">
                      <div className="avatar">👴</div>
                      <span>Paciente</span>
                    </div>
                    <div className="participant family">
                      <div className="avatar">👩</div>
                      <span>Familiar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solo mostrar las otras secciones si no está autenticado */}
      {!isAuthenticated && (
        <>
          {/* Features Section */}
          <section id="features" className="features-section">
            <div className="container">
              <div className="section-header">
                <h2>¿Para Quién es Vincula?</h2>
                <p>Diseñado para conectar a las personas que más importan en el cuidado de la salud</p>
              </div>
              
              <div className="features-grid">
                {/* Para Doctores */}
                <div className="feature-card">
                  <div className="feature-icon">👨‍⚕️</div>
                  <h3>Para Profesionales de la Salud</h3>
                  <ul>
                    <li>Consultas médicas virtuales seguras</li>
                    <li>Acceso completo al historial del paciente</li>
                    <li>Sistema de cola inteligente por prioridad</li>
                    <li>Grabación automática de consultas</li>
                    <li>Comunicación directa con familiares</li>
                  </ul>
                  <div className="feature-highlight">
                    Atiende a tus pacientes desde cualquier lugar con la máxima seguridad
                  </div>
                </div>

                {/* Para Pacientes */}
                <div className="feature-card">
                  <div className="feature-icon">🏥</div>
                  <h3>Para Pacientes</h3>
                  <ul>
                    <li>Solicita consultas médicas fácilmente</li>
                    <li>Invita a familiares a tus consultas</li>
                    <li>Acompañamiento virtual 24/7</li>
                    <li>Acceso desde hospital o casa</li>
                    <li>Historial de todas tus consultas</li>
                  </ul>
                  <div className="feature-highlight">
                    Nunca estés solo durante tu tratamiento médico
                  </div>
                </div>

                {/* Para Familiares */}
                <div className="feature-card">
                  <div className="feature-icon">👨‍👩‍👧‍👦</div>
                  <h3>Para Familiares y Acompañantes</h3>
                  <ul>
                    <li>Acompaña virtualmente a tu ser querido</li>
                    <li>Observa consultas médicas en tiempo real</li>
                    <li>Modo observador silencioso disponible</li>
                    <li>Participa activamente cuando sea necesario</li>
                    <li>Tranquilidad para toda la familia</li>
                  </ul>
                  <div className="feature-highlight">
                    Mantente cerca de quien amas, sin importar la distancia
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="how-it-works-section">
            <div className="container">
              <div className="section-header">
                <h2>Cómo Funciona Vincula</h2>
                <p>Tres simples pasos para conectar y acompañar</p>
              </div>
              
              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Solicita o Programa</h3>
                    <p>Los pacientes pueden solicitar consultas médicas o los doctores pueden programar citas. Los familiares reciben invitaciones automáticas.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Conecta y Acompaña</h3>
                    <p>Únete a la videollamada desde cualquier dispositivo. Los familiares pueden observar silenciosamente o participar activamente según se necesite.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Revisa y Sigue</h3>
                    <p>Todas las consultas se graban automáticamente. Accede al historial médico y mantén seguimiento del progreso del tratamiento.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="benefits-section">
            <div className="container">
              <div className="benefits-content">
                <div className="benefits-text">
                  <h2>¿Por Qué Elegir Vincula?</h2>
                  <div className="benefits-list">
                    <div className="benefit-item">
                      <div className="benefit-icon">🔒</div>
                      <div>
                        <h4>Seguridad Garantizada</h4>
                        <p>Cumplimos con todas las normativas de privacidad médica. Tus datos están protegidos.</p>
                      </div>
                    </div>
                    
                    <div className="benefit-item">
                      <div className="benefit-icon">🌐</div>
                      <div>
                        <h4>Acceso Universal</h4>
                        <p>Funciona en cualquier dispositivo con internet. Hospital, casa o donde estés.</p>
                      </div>
                    </div>
                    
                    <div className="benefit-item">
                      <div className="benefit-icon">👁️</div>
                      <div>
                        <h4>Modo Observador Único</h4>
                        <p>Los familiares pueden acompañar virtualmente sin interrumpir la consulta médica.</p>
                      </div>
                    </div>
                    
                    <div className="benefit-item">
                      <div className="benefit-icon">📱</div>
                      <div>
                        <h4>Multiplataforma</h4>
                        <p>Disponible en computadora, tablet y móvil. Siempre accesible cuando lo necesites.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="cta-section">
            <div className="container">
              <div className="cta-content">
                <h2>¿Listo para Conectar?</h2>
                <p>Únete a miles de familias que ya confían en Vincula para mantenerse cerca de sus seres queridos</p>
                <div className="cta-buttons">
                  <button onClick={() => navigate('/register')} className="btn-primary-large">
                    Crear Cuenta Gratis
                  </button>
                  <button onClick={handleGetStarted} className="btn-secondary-large">
                    Iniciar Sesión
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer id="contact" className="landing-footer">
            <div className="container">
              <div className="footer-content">
                <div className="footer-section">
                  <h3>🏥 Vincula</h3>
                  <p>Conectando corazones a través de la tecnología médica</p>
                </div>
                <div className="footer-section">
                  <h4>Contacto</h4>
                  <p>Email: soporte@vincula.com</p>
                  <p>Teléfono: +1 (555) 123-4567</p>
                </div>
                <div className="footer-section">
                  <h4>Soporte</h4>
                  <p>Disponible 24/7 para emergencias</p>
                  <p>Chat en vivo disponible</p>
                </div>
              </div>
              <div className="footer-bottom">
                <p>&copy; 2024 Vincula. Todos los derechos reservados.</p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

// Función auxiliar para obtener etiquetas de rol
const getRoleLabel = (role) => {
  switch (role) {
    case 'patient': return 'Paciente';
    case 'employee': return 'Profesional de la Salud';
    case 'family': return 'Familiar/Acompañante';
    case 'admin': return 'Administrador';
    default: return 'Usuario';
  }
}; 