import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from '../pages/AdminPages'
import { AdminLogin } from '../pages/auth/AdminLogin'

export function AppRouter() {
  return <Routes><Route path="/login" element={<AdminLogin />} /><Route path="/admin/*" element={<AdminPage />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes>
}
