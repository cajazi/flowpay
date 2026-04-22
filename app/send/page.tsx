'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export default function SendPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [receiverEmail, setReceiverEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // 🔐 AUTH GUARD
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth')
    }
  }, [user, authLoading, router])

  // ⛔ Prevent flicker
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking session...
      </div>
    )
  }

  if (!user) return null

  // ✅ VALIDATION
  const validate = () => {
    const email = receiverEmail.trim().toLowerCase()
    const parsedAmount = Number(amount)

    if (!email) return 'Enter receiver email'
    if (!email.includes('@')) return 'Invalid email'
    if (!amount || isNaN(parsedAmount)) return 'Enter valid amount'
    if (parsedAmount <= 0) return 'Amount must be greater than 0'
    if (parsedAmount > 1000000) return 'Amount too large'

    return null
  }

  // 💸 SEND FUNCTION
  const sendMoney = async () => {
    if (loading) return

    setMessage(null)

    const error = validate()
    if (error) {
      setMessage(error)
      return
    }

    setLoading(true)

    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token

      if (!token) {
        setMessage('Session expired. Login again.')
        return
      }

      // ⏱ Timeout protection
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(
        'https://lfljkiyiywaffzvlrbhz.supabase.co/functions/v1/transfer-money',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receiverEmail: receiverEmail.trim().toLowerCase(),
            amount: Number(amount),
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timeout)

      const result = await res.json()

      if (!res.ok) {
        setMessage(result.error || 'Transfer failed')
        return
      }

      setMessage('✅ Transfer successful')
      setReceiverEmail('')
      setAmount('')
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessage('Request timeout')
      } else {
        console.error(err)
        setMessage('Network error')
      }
    } finally {
      setLoading(false)
    }
  }

  // 🎨 UI
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Send Money
        </h1>

        {message && (
          <div
            className={`text-sm text-center p-2 rounded-lg ${
              message.includes('successful')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Receiver Email"
          value={receiverEmail}
          onChange={(e) => setReceiverEmail(e.target.value)}
          disabled={loading}
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        />

        <button
          onClick={sendMoney}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold transition ${
            loading
              ? 'bg-gray-400'
              : 'bg-green-600 hover:bg-green-700 active:scale-95'
          }`}
        >
          {loading ? 'Processing...' : 'Send Money'}
        </button>
      </div>
    </div>
  )
}