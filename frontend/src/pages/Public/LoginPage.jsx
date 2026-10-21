import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginUser } from '../../services/authApi'
import InputField from '../../components/InputField'
import Button from '../../components/Button'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true })
    }
  }, [isAuthenticated, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginUser({ username, password })
      const { token, role, username: uname, mustChangePassword } = res.data
      login(token, { role, username: uname, mustChangePassword: mustChangePassword || false })
      navigate(`/${role}/dashboard`, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-orange-700 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background accents */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <span className="bg-orange-500 text-white text-sm font-bold px-2.5 py-1.5 rounded-lg tracking-wide">
              JSS
            </span>
            <span className="text-xl font-bold text-white">
              Jai Shree Shyam
            </span>
          </Link>
          <p className="text-blue-100/80 text-sm mt-3">Sign in to your account</p>
        </div>

        <div className="bg-white border border-blue-100 rounded-2xl p-8 shadow-xl shadow-blue-950/30">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">
            Access is by invite only. Contact your admin.
          </p>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          &copy; {new Date().getFullYear()} JSS &mdash; Jai Shree Shyam Coaching Institute
        </p>
      </div>
    </div>
  )
}

export default LoginPage
