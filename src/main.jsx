import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AppToaster from './components/AppToaster.jsx'
import { AuthSessionProvider } from './context/AuthSessionContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { PublicContentProvider } from './hooks/usePublicContent.js'
import 'react-day-picker/style.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppToaster />
      <AuthSessionProvider>
        <PublicContentProvider>
          <App />
        </PublicContentProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
