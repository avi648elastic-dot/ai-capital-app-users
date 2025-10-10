import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '../contexts/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-Capital | Professional Portfolio Management',
  description: 'AI-powered stock portfolio management with real-time market analysis and intelligent trading decisions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        <ThemeProvider>
          <div className="min-h-screen bg-slate-950">
            {children}
            {/* Build/version footer for deployment verification */}
            <div className="fixed bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
