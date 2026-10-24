import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export function AdminLogin() {
  const { configured, user, signIn } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  if (user) return <Navigate to="/admin" replace />
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true)
    try { await signIn(email, password); navigate('/admin') }
    catch (cause) { push(cause instanceof Error ? cause.message : 'Sign-in failed.', 'error') }
    finally { setSaving(false) }
  }
  return <main className="admin-screen admin-screen--center"><div className="admin-login"><div className="admin-brand admin-brand--dark"><span className="admin-brand-mark">M</span><span>Meridion<small>ADMIN STUDIO</small></span></div><p className="admin-kicker">Authorized access only</p><h1>Sign in to Meridion Admin</h1>{!configured ? <p>Configure the Supabase project credentials in <code>.env.local</code> before signing in.</p> : <form className="admin-form" onSubmit={(event) => void submit(event)}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="admin-button" disabled={saving}>{saving ? 'Signing in…' : 'Sign in'}</button></form>}<p className="admin-login-note">Administrator access is verified by the Supabase role policy. This app never grants roles or exposes service credentials.</p></div></main>
}
