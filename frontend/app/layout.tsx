import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-Capital | Professional Portfolio Management',
  description: 'AI-powered stock portfolio management with real-time market analysis and intelligent trading decisions',
  // Force rebuild to apply design changes
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-950">
          {children}
          {/* Build/version footer for deployment verification */}
          <div className="fixed bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
            v{process.env.npm_package_version || 'dev'} · API: {process.env.NEXT_PUBLIC_API_URL || 'unset'}
          </div>
        </div>
      </body>
    </html>
  )
}
