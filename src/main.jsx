import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
// Fonts — local via fontsource (PWA-safe, no network dependency)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/900.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/700.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallback from './pages/AuthCallback'
import ProtectedRoute from './components/ProtectedRoute'
import PlazaPage from './pages/PlazaPage'
import CreateMatchPage from './pages/CreateMatchPage'
import JoinMatchPage from './pages/JoinMatchPage'
import SubmitResultPage from './pages/SubmitResultPage'
import ProfilePage from './pages/ProfilePage'
import OfflineToast from './ui/OfflineToast'
import PWAInstallPrompt from './ui/PWAInstallPrompt'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <OfflineToast />
        <PWAInstallPrompt />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><PlazaPage /></ProtectedRoute>} />
          <Route path="/create-match" element={<ProtectedRoute><CreateMatchPage /></ProtectedRoute>} />
          <Route path="/join" element={<ProtectedRoute><JoinMatchPage /></ProtectedRoute>} />
          <Route path="/submit/:matchId" element={<ProtectedRoute><SubmitResultPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
