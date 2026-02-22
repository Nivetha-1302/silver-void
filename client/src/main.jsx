import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'

import ErrorBoundary from './components/ErrorBoundary.jsx'
import axios from 'axios';

// Backend configuration for Production (Render) and Local
const isProduction = window.location.hostname !== 'localhost';
axios.defaults.baseURL = isProduction
  ? 'https://silver-void.onrender.com'
  : 'https://localhost:5000';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
