import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import './utils/mockServer'; // Mock server deshabilitado para producción

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);