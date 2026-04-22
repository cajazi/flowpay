'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import { supabase } from '@/lib/supabase'

type Transaction = {
  id: string
  sender_id: string
  receiver_id: string
  amount: number
  status: string
  created_at: string
}

export default function ReceiptPage() {
  const [data, setData] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const transactionId = searchParams.get('id')

  // 🔒 SECURE FETCH
  const fetchReceipt = useCallback(async () => {
    if (!transactionId) {
      setError('Invalid transaction')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (!user) {
        setError('Unauthorized')
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select(
          'id, sender_id, receiver_id, amount, status, created_at'
        )
        .match({ id: transactionId })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .single()

      if (error) throw error

      setData(data)
    } catch (err: any) {
      console.error(err)
      setError('Unable to load receipt')
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    fetchReceipt()
  }, [fetchReceipt])

  // 💰 FORMAT
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)

  // 📄 PDF
  const downloadPDF = useCallback(() => {
    if (!data) return

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('FlowPay Receipt', 20, 20)

    doc.setFontSize(12)
    doc.text(`Amount: ${formatCurrency(data.amount)}`, 20, 40)
    doc.text(`Status: ${data.status}`, 20, 50)
    doc.text(
      `Date: ${new Date(data.created_at).toLocaleString()}`,
      20,
      60
    )
    doc.text(`Transaction ID: ${data.id}`, 20, 70)

    doc.save(`receipt-${data.id}.pdf`)
  }, [data])

  // 📤 SHARE
  const shareReceipt = useCallback(async () => {
    if (!data) return

    const text = `FlowPay Receipt\nAmount: ${formatCurrency(
      data.amount
    )}\nStatus: ${data.status}`

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Receipt',
          text,
        })
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          '_blank'
        )
      }
    } catch (err) {
      console.error('Share failed', err)
    }
  }, [data])

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-pulse text-gray-400">
        Loading receipt...
      </div>
    )
  }

  // ❌ ERROR
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  if (!data) return null

  // 🎨 STATUS COLOR
  const statusStyle =
    data.status === 'completed'
      ? 'bg-green-100 text-green-700'
      : data.status === 'pending'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700'

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-6 space-y-6"
      >

        {/* Header */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-semibold text-center text-gray-800"
        >
          Transaction Receipt
        </motion.h1>

        {/* Amount */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">Amount</p>

          <motion.h2
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
            className="text-4xl font-bold text-green-600 mt-1"
          >
            {formatCurrency(data.amount)}
          </motion.h2>
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusStyle}`}>
            {data.status}
          </span>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm text-gray-600">

          <div className="flex justify-between">
            <span>Date</span>
            <span>{new Date(data.created_at).toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span>Transaction ID</span>
            <span className="text-xs break-all max-w-[160px] text-right">
              {data.id}
            </span>
          </div>

        </div>

        {/* Actions */}
        <div className="space-y-3">

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={downloadPDF}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition"
          >
            Download PDF
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={shareReceipt}
            className="w-full py-3 bg-black text-white rounded-xl font-semibold"
          >
            Share Receipt
          </motion.button>

        </div>

        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full text-center text-gray-400 text-sm"
        >
          Back to dashboard
        </button>

      </motion.div>
    </div>
  )
}