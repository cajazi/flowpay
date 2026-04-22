'use client'

import { motion } from 'framer-motion'

export default function ReceiptCard({ data }: any) {
  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 space-y-6"
      >
        <h1 className="text-xl font-bold text-center">
          Transaction Receipt
        </h1>

        <div className="text-center">
          <p className="text-gray-500">Amount</p>

          <motion.h2
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-green-600"
          >
            ₦{data.amount.toLocaleString()}
          </motion.h2>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p>Status: {data.status}</p>
          <p>Date: {new Date(data.created_at).toLocaleString()}</p>
          <p className="break-all text-xs">ID: {data.id}</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 bg-green-600 text-white rounded-xl"
        >
          Download PDF
        </motion.button>
      </motion.div>
    </div>
  )
}