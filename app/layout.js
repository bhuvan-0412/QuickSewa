import { Inter, Poppins, Noto_Sans_Telugu } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from './lib/language'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-noto-telugu',
  display: 'swap',
})

export const metadata = {
  title: 'QuickSewa — Report Civic Issues in Hyderabad',
  description: 'One tap to report potholes, garbage, broken streetlights and more directly to GHMC.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${notoTelugu.variable}`}>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}


