import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthSessionProvider } from './context/AuthSessionContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthSessionProvider>
        <App />
      </AuthSessionProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
