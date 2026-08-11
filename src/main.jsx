import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { WalletProvider } from './context/WalletContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WalletProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </WalletProvider>
    </AuthProvider>
  </StrictMode>,
)
