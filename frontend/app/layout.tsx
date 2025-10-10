import type { Metadata } from 'next'
import { Inter, Cairo, Amiri, Heebo, David } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import { TourProvider } from '@/contexts/TourContext'
import TourOverlay from '@/components/TourOverlay'

const inter = Inter({ subsets: ['latin'] })
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' })
const amiri = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri' })
const heebo = Heebo({ subsets: ['hebrew'], variable: '--font-heebo' })
const david = David({ subsets: ['hebrew'], weight: ['400', '700'], variable: '--font-david' })

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
      <body className={`${inter.className} ${cairo.variable} ${amiri.variable} ${heebo.variable} ${david.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            <TourProvider>
              <div className="min-h-screen bg-slate-950">
                {children}
                {/* Tour Overlay */}
                <TourOverlay />
                {/* Build/version footer for deployment verification */}
                <div className="fixed bottom-2 right-2 text-[10px] px-2 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                </div>
              </div>
            </TourProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
