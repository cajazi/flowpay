'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function FundPage() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Validate input
  const validate = () => {
    const value = Number(amount)

    if (!amount) return 'Enter amount'
    if (isNaN(value)) return 'Invalid amount'
    if (value <= 0) return 'Amount must be greater than 0'
    if (value > 10000000) return 'Amount too large'

    return null
  }

  // 🚀 PAYMENT HANDLER (CLEAN + SECURE)
  const pay = async () => {
    if (loading) return

    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // 🔐 Ensure user is logged in
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData?.user) {
        throw new Error('You must be logged in')
      }

      // 🔐 Get fresh token (fixes 401 permanently)
      const { data: sessionData, error: sessionError } =
        await supabase.auth.refreshSession()

      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please login again.')
      }

      const token = sessionData.session.access_token
      const email = sessionData.session.user.email

      console.log('TOKEN:', token)
      console.log('EMAIL:', email)

      const res = await fetch(
        'https://lfljkiyiywaffzvlrbhz.supabase.co/functions/v1/init-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // ✅ FIXED
          },
          body: JSON.stringify({
            email,
            amount: Number(amount),
          }),
        }
      )

      // ✅ Safe JSON parse
      let result: any = null
      try {
        result = await res.json()
      } catch {
        throw new Error('Invalid server response')
      }

      if (!res.ok) {
        throw new Error(result?.error || 'Payment failed')
      }

      if (!result?.authorization_url) {
        throw new Error('Payment initialization failed')
      }

      // 🚀 Redirect to Paystack
      window.location.href = result.authorization_url

    } catch (err: any) {
      console.error('PAY ERROR:', err)

      if (err.message.includes('Failed to fetch')) {
        setError('Network error. Check connection.')
      } else {
        setError(err.message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-xl space-y-5">

        {/* Title */}
        <h1 className="text-xl font-bold text-center">
          Fund Wallet
        </h1>

        {/* Error */}
        {error && (
          <div className="text-sm text-center text-red-600 bg-red-50 p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Amount Input */}
        <input
          type="number"
          inputMode="decimal"
          placeholder="₦1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
        />

        {/* Button */}
        <button
          onClick={pay}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-semibold text-white transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 active:scale-95'
          }`}
        >
          {loading ? 'Processing...' : 'Pay with Paystack'}
        </button>

      </div>
    </div>
  )
}