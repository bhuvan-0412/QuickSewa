import './globals.css'
import { LanguageProvider } from './lib/language'

export const metadata = {
  title: 'QuickSewa — Report Civic Issues in Hyderabad',
  description: 'One tap to report potholes, garbage, broken streetlights and more directly to GHMC.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

