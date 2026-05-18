import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthInit } from './hooks/useAuth'
import { useAuthStore } from './lib/store'
import { PageLoader } from './components/ui/Spinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OrcamentoEditor from './pages/OrcamentoEditor'
import Clientes from './pages/Clientes'
import Configuracoes from './pages/Configuracoes'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AuthRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  useAuthInit()

  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute><Login /></AuthRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/orcamentos" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/orcamentos/:id" element={
        <ProtectedRoute><OrcamentoEditor /></ProtectedRoute>
      } />
      <Route path="/clientes" element={
        <ProtectedRoute><Clientes /></ProtectedRoute>
      } />
      <Route path="/configuracoes" element={
        <ProtectedRoute><Configuracoes /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
