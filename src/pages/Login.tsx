import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { login, clearError } from '../features/auth/authSlice'

export default function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { token, loading, error } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (token) navigate('/admin', { replace: true })
  }, [token, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(login({ email, password }))
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>✦ Shimmer Diva</h1>
          <p>Admin Panel</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@shimmerdiva.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
