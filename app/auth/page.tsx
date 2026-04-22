'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isLogin, setIsLogin] = useState(true)

  const validate = () => {
    if (!email.trim()) return 'Email is required'
    if (!email.includes('@')) return 'Invalid email'
    if (!password) return 'Password required'
    if (password.length < 6) return 'Password too short'
    return null
  }

  const handleAuth = async () => {
    if (loading) return

    setMessage(null)

    const error = validate()
    if (error) {
      setMessage(error)
      return
    }

    setLoading(true)

    try {
      let res

      if (isLogin) {
        res = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      } else {
        res = await supabase.auth.signUp({
          email,
          password,
        })
      }

      if (res.error) {
        setMessage(res.error.message)
        return
      }

      setMessage(
        isLogin
          ? '✅ Login successful'
          : '✅ Account created'
      )

      setTimeout(() => {
        router.push('/dashboard')
      }, 800)

    } catch (err) {
      console.error(err)
      setMessage('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-xl space-y-5">

        <div className="text-center">
          <h1 className="text-2xl font-bold">FlowPay</h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Login to your account' : 'Create an account'}
          </p>
        </div>

        {message && (
          <div className="text-sm text-center p-2 rounded-xl bg-gray-100">
            {message}
          </div>
        )}

        <input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />

        <input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold transition ${
            loading
              ? 'bg-gray-400'
              : 'bg-green-600 hover:bg-green-700 active:scale-95'
          }`}
        >
          {loading
            ? 'Processing...'
            : isLogin
            ? 'Login'
            : 'Sign Up'}
        </button>

        <p className="text-center text-sm text-gray-500">
          {isLogin
            ? "Don't have an account?"
            : 'Already have an account?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-green-600 font-medium"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>

      </div>
    </div>
  )
}