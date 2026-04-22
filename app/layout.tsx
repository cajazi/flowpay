import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "FlowPay",
  description: "Fast, secure digital payments",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-screen bg-gray-100 antialiased flex flex-col">

        {/* App Content */}
        <main className="flex-1">{children}</main>

        {/* Global Toast System */}
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "text-sm rounded-xl shadow-md px-4 py-3",
            success: {
              className: "bg-green-600 text-white",
            },
            error: {
              className: "bg-red-500 text-white",
            },
          }}
        />

      </body>
    </html>
  )
}