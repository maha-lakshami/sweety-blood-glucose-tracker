
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Heart, User, Mail, Lock, ArrowRight } from 'lucide-react'

const API_URL = 'http://localhost:5000/api/auth'

export default function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    try {
      setLoading(true)

      const response = await axios.post(
        `${API_URL}/register`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password
        }
      )

      navigate('/login', {
        state: {
          successMessage: response.data.message
        }
      })

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          'Unable to create account. Please try again.'
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
            Start your health journey!
          </h1>

          <p className="mt-4 leading-7 text-purple-100">
            Create your Sweety account and keep your
            daily glucose readings organized in one place.
          </p>

          <div className="mt-10 rounded-2xl bg-white/10 p-6">
            <p className="text-lg font-medium">
              Small steps. Better habits. Healthier living.
            </p>
            <p className="mt-2 text-sm text-purple-200">
              Welcome to Sweety 💜
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">

          <div className="mb-7">
            <div className="flex items-center gap-2 text-purple-600">
              <Heart size={25} fill="currentColor" />
              <span className="text-2xl font-bold">Sweety</span>
            </div>

            <h2 className="mt-7 text-3xl font-bold">
              Create account
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Join Sweety and start tracking your health.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Full name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4">
                <User size={18} className="text-gray-400" />

                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4">
                <Mail size={18} className="text-gray-400" />

                <input
                  required
                  type="email"
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
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-purple-600">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
