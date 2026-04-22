'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import TransactionList from '@/components/TransactionList'
import { supabase } from '@/lib/supabase'

type Props = {
  user: { id: string } | null
  transactions: any[]
  balance: number
  loading: boolean
}

export default function DashboardUI({
  user,
  transactions,
  balance,
  loading,
}: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  // 💰 Format currency safely
  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount ?? 0)

  // 🔐 Logout
  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.replace('/auth')
    } catch (err) {
      console.error(err)
    } finally {
      setLoggingOut(false)
    }
  }

  // ⚡ Navigation handlers (better performance)
  const goToSend = () => router.push('/send')
  const goToFund = () => router.push('/fund')

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse text-gray-400">
        Loading dashboard...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-screen bg-gray-100 p-4 space-y-6 max-w-2xl mx-auto"
    >

      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-xl font-bold">Dashboard</h1>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-sm text-red-500 hover:opacity-70 transition disabled:opacity-50"
        >
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </motion.div>

      {/* 💰 Balance */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-green-600 text-white rounded-3xl p-6 shadow-lg"
      >
        <p className="text-sm opacity-80">Available Balance</p>

        <motion.h2
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="text-3xl font-bold mt-1"
        >
          {formatCurrency(balance)}
        </motion.h2>
      </motion.div>

      {/* ⚡ Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={goToSend}
          className="bg-white p-4 rounded-2xl shadow font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Send Money
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={goToFund}
          className="bg-white p-4 rounded-2xl shadow font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Fund Wallet
        </motion.button>
      </motion.div>

      {/* 📜 Transactions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h2 className="text-sm text-gray-500">
          Recent Transactions
        </h2>

        {!transactions?.length ? (
          <div className="bg-white p-6 rounded-2xl text-center text-gray-400 space-y-3">
            <p>No transactions yet</p>

            <button
              type="button"
              onClick={goToSend}
              className="text-green-600 text-sm font-medium hover:underline"
            >
              Send your first payment →
            </button>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            userId={user?.id ?? ''}
          />
        )}
      </motion.div>

    </motion.div>
  )
}