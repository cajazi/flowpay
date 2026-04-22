'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white flex flex-col items-center justify-center px-4">

      {/* Logo / Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          FlowPay
        </h1>
        <p className="text-gray-500 mt-2">
          Fast • Secure • Reliable
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-4">

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-black text-white rounded-2xl font-semibold shadow-md hover:opacity-90 active:scale-95 transition"
        >
          Go to Dashboard
        </button>

        <button
          onClick={() => router.push('/send')}
          className="w-full py-3 bg-green-600 text-white rounded-2xl font-semibold shadow-md hover:bg-green-700 active:scale-95 transition"
        >
          Send Money
        </button>

      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-10">
        © 2026 FlowPay
      </p>
    </div>
  )
}