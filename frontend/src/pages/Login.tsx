
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { Heart, Mail, Lock, ArrowRight } from 'lucide-react'

const API_URL = 'http://localhost:5000/api/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const successMessage = location.state?.successMessage as string | undefined

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)

      const response = await axios.post(`${API_URL}/login`, {
        email: email.trim().toLowerCase(),
        password
      })

      const { token, user } = response.data

      // Store authentication details
      localStorage.setItem('sweety_token', token)
      localStorage.setItem('sweety_user', JSON.stringify(user))

      // Open dashboard only after successful authentication
      navigate('/dashboard', { replace: true })

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          'Unable to login. Please try again.'
        )
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f6ff] p-5">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

        <div className="hidden flex-col justify-center bg-purple-600 p-12 text-white md:flex">
          <Heart size={45} fill="white" />

          <h1 className="mt-8 text-4xl font-bold">
            Welcome back!
          </h1>

          <p className="mt-4 leading-7 text-purple-100">
            Take control of your health journey.
            Track your glucose levels and stay informed
            with Sweety.
          </p>

          <div className="mt-10 rounded-2xl bg-white/10 p-6">
            <p className="text-lg font-medium">
              "Your health is your greatest wealth."
            </p>
            <p className="mt-2 text-sm text-purple-200">
              Your daily health companion 💜
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">

          <div className="mb-8">
            <div className="flex items-center gap-2 text-purple-600">
              <Heart size={25} fill="currentColor" />
              <span className="text-2xl font-bold">Sweety</span>
            </div>

            <h2 className="mt-8 text-3xl font-bold">
              Sign in
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Enter your details to access your account.
            </p>
          </div>

          {successMessage && (
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4">
                <Mail size={18} className="text-gray-400" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4">
                <Lock size={18} className="text-gray-400" />

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <p className="mt-7 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-purple-600">
              Create account
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-gray-400">
            © 2026 Sweety Glucose Tracker
          </p>

        </div>
      </div>
    </div>
  )
}
