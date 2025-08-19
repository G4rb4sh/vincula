import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
              <h1>Vincula</h1>
            </div>
            <nav className="nav-menu">
              <a href="#features">Características</a>
              <a href="#how-it-works">Cómo Funciona</a>
              <a href="#contact">Contacto</a>
              {isAuthenticated ? (
                <div className="user-menu">
                  <span className="user-greeting">
                    Hola, {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                  </span>
                  <button onClick={handleGetStarted} className="btn-dashboard">
                    Ir al Dashboard
                  </button>
                  <button onClick={handleLogout} className="btn-logout">
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <motion.button 
                  onClick={handleGetStarted} 
                  className="btn-login-header"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Iniciar Sesión
                </motion.button>
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
                  <motion.h1 
                    className="hero-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    ¡Bienvenido de vuelta, {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}!
                  </motion.h1>
                  <motion.p 
                    className="hero-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Estás conectado como <strong>{getRoleLabel(user?.role)}</strong>. 
                    Accede a tu dashboard para acompañar virtualmente a tu ser querido.
                  </motion.p>
                  <motion.div 
                    className="hero-buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <motion.button 
                      onClick={handleGetStarted} 
                      className="btn-primary-large"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Ir al Dashboard
                    </motion.button>
                    <motion.button 
                      onClick={handleLogout} 
                      className="btn-secondary-large"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cerrar Sesión
                    </motion.button>
                  </motion.div>
                  <div className="user-status">
                    <div className="status-card">
                      <h3>Tu información:</h3>
                      <p><strong>Nombre:</strong> {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Rol:</strong> {getRoleLabel(user?.role)}</p>
                      <p><strong>Estado:</strong> <span className="status-active">Activo</span></p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <motion.h1 
                    className="hero-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    Acompaña a tu Ser Querido Desde Cualquier Lugar
                  </motion.h1>
                  <motion.p 
                    className="hero-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Vincula es la plataforma que permite a familiares y acompañantes estar presentes 
                    virtualmente durante consultas médicas. <strong>Todas las sesiones se graban automáticamente </strong> 
                    para que puedas revisar la información médica cuando lo necesites.
                  </motion.p>
                  <motion.div 
                    className="hero-buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <motion.button 
                      onClick={() => navigate('/register')} 
                      className="btn-primary-large"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Crear Cuenta Gratis
                    </motion.button>
                    <motion.button 
                      onClick={handleGetStarted} 
                      className="btn-secondary-large"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Iniciar Sesión
                    </motion.button>
                  </motion.div>
                </>
              )}
            </div>
            <motion.div 
              className="hero-image"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="hero-illustration">
                <div className="video-call-mockup">
                  <div className="mockup-screen">
                    <div className="participant doctor">
                      <div className="avatar medical-professional">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                      </div>
                      <span>Dr. García</span>
                    </div>
                    <div className="participant patient">
                      <div className="avatar patient">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                      </div>
                      <span>Paciente</span>
                    </div>
                    <div className="participant family">
                      <div className="avatar family">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                        </svg>
                      </div>
                      <span>Familiar</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solo mostrar las otras secciones si no está autenticado */}
      {!isAuthenticated && (
        <>
          {/* Features Section */}
          <section id="features" className="features-section">
            <div className="container">
              <motion.div 
                className="section-header"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2>¿Para Quién es Vincula?</h2>
                <p>Diseñado para conectar a las personas que más importan en el cuidado de la salud</p>
              </motion.div>
              
              <div className="features-grid">
                {/* Para Doctores */}
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2L13.09,8.26L22,9L17.22,13.78L18.18,22L12,19.77L5.82,22L6.78,13.78L2,9L10.91,8.26L12,2Z"/>
                    </svg>
                  </div>
                  <h3>Para Profesionales de la Salud</h3>
                  <ul>
                    <li>Consultas médicas virtuales seguras</li>
                    <li>Acceso completo al historial del paciente</li>
                    <li>Sistema de cola inteligente por prioridad</li>
                    <li>Grabación automática de consultas</li>
                    <li>Resúmenes inteligentes con IA</li>
                    <li>Comunicación directa con familiares</li>
                  </ul>
                  <div className="feature-highlight">
                    Atiende a tus pacientes desde cualquier lugar con la máxima seguridad
                  </div>
                </div>

                {/* Para Pacientes */}
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                    </svg>
                  </div>
                  <h3>Para Pacientes</h3>
                  <ul>
                    <li>Solicita consultas médicas fácilmente</li>
                    <li>Invita a familiares a tus consultas</li>
                    <li>Acompañamiento virtual 24/7</li>
                    <li>Acceso desde hospital o casa</li>
                    <li>Historial de todas tus consultas</li>
                    <li>Resúmenes inteligentes de cada sesión</li>
                  </ul>
                  <div className="feature-highlight">
                    Nunca estés solo durante tu tratamiento médico
                  </div>
                </div>

                {/* Para Familiares */}
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16,4C18.21,4 20,5.79 20,8C20,10.21 18.21,12 16,12C13.79,12 12,10.21 12,8C12,5.79 13.79,4 16,4M16,14C20.42,14 24,15.79 24,18V20H8V18C8,15.79 11.58,14 16,14M8.5,4C10.43,4 12,5.57 12,7.5C12,9.43 10.43,11 8.5,11C6.57,11 5,9.43 5,7.5C5,5.57 6.57,4 8.5,4M8.5,13C11.87,13 14.5,14.16 14.5,15.5V17H0V15.5C0,14.16 2.63,13 8.5,13Z"/>
                    </svg>
                  </div>
                  <h3>Para Familiares y Acompañantes</h3>
                  <ul>
                    <li>Acompaña virtualmente a tu ser querido</li>
                    <li>Observa consultas médicas en tiempo real</li>
                    <li>Acceso completo a grabaciones de consultas</li>
                    <li>Resúmenes automáticos de cada sesión</li>
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

          {/* Recording Benefits Section */}
          <section className="recording-section">
            <div className="container">
              <motion.div 
                className="recording-content"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <div className="recording-text">
                  <h2>Todas las Consultas se Graban Automáticamente</h2>
                  <p>
                    Como familiar o acompañante, tienes acceso completo a todas las grabaciones 
                    de las consultas médicas de tu ser querido, además de resúmenes inteligentes 
                    generados automáticamente. Esto significa que:
                  </p>
                  <div className="recording-benefits">
                    <div className="recording-benefit">
                      <div className="benefit-icon video-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4>Revisión Completa</h4>
                        <p>Puedes ver las consultas cuantas veces necesites para entender mejor las indicaciones médicas</p>
                      </div>
                    </div>
                    <div className="recording-benefit">
                      <div className="benefit-icon share-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M17,13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4>Compartir con Familia</h4>
                        <p>Comparte información médica importante con otros familiares de manera segura</p>
                      </div>
                    </div>
                    <div className="recording-benefit">
                      <div className="benefit-icon security-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,17C9.8,17 8,15.2 8,13S9.8,9 12,9S16,10.8 16,13S14.2,17 12,17Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4>Historial Seguro</h4>
                        <p>Todas las grabaciones están cifradas y protegidas bajo estándares médicos</p>
                      </div>
                    </div>
                    <div className="recording-benefit">
                      <div className="benefit-icon ai-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M16,11H8V10H16V11M16,14H8V13H16V14M12,17H8V16H12V17Z"/>
                        </svg>
                      </div>
                      <div>
                        <h4>Resúmenes Inteligentes</h4>
                        <p>IA genera automáticamente transcripciones y extrae los puntos clave más importantes de cada sesión</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="recording-visual">
                  <div className="recording-mockup">
                    <div className="video-player">
                      <div className="video-controls">
                        <div className="play-button">▶</div>
                        <div className="progress-bar">
                          <div className="progress"></div>
                        </div>
                        <div className="video-info">
                          <span>Consulta - 15 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
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
                  <h3>Vincula</h3>
                  <p>Conectando corazones a través de la tecnología médica</p>
                  <p><strong>Todas las consultas se graban automáticamente</strong> para su revisión posterior</p>
                </div>
                <div className="footer-section">
                  <h4>Contacto</h4>
                  <p>Email: soporte@vincula.com</p>
                  <p>Teléfono: +598 99 123 456</p>
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
    case 'employee': return 'Acompañante Profesional';
    case 'family': return 'Familiar/Acompañante';
    case 'admin': return 'Administrador';
    default: return 'Usuario';
  }
}; 