import type { ReactNode } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
}
