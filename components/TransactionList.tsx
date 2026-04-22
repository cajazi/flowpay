'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

type Transaction = {
  id: string
  sender_id: string
  receiver_id: string
  amount: number
  status: string
  created_at: string
}

export default function TransactionList({
  transactions,
  userId,
}: {
  transactions: Transaction[]
  userId: string
}) {
  const router = useRouter()

  // 💰 Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)

  // 📅 Format date
  const formatDate = (date: string) =>
    new Date(date).toLocaleString()

  if (!transactions?.length) {
    return (
      <div className="bg-white p-6 rounded-2xl text-center text-gray-400">
        No transactions yet
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {transactions.map((tx, index) => {
        const isSender = tx.sender_id === userId

        const statusColor =
          tx.status === 'completed'
            ? 'text-green-600'
            : tx.status === 'pending'
            ? 'text-yellow-500'
            : 'text-red-500'

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push(`/receipt?id=${tx.id}`)}
            className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer transition"
          >
            {/* LEFT */}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isSender ? 'Sent' : 'Received'}
              </p>

              <p className="text-xs text-gray-500">
                {formatDate(tx.created_at)}
              </p>

              <p className={`text-xs capitalize ${statusColor}`}>
                {tx.status}
              </p>
            </div>

            {/* RIGHT */}
            <p
              className={`font-semibold ${
                isSender ? 'text-red-500' : 'text-green-600'
              }`}
            >
              {isSender ? '-' : '+'}
              {formatCurrency(tx.amount)}
            </p>
          </motion.div>
        )
      })}
    </motion.div>
  )
}