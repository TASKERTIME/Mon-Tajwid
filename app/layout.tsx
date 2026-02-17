import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mon Tajwid',
  description: 'Apprends le Coran avec le Tajwid — reconnaissance vocale IA',
  manifest: '/manifest.json',
}
export const viewport: Viewport = {
  themeColor: '#080d1a', width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr"><head><link rel="apple-touch-icon" href="/icon-192.png" /></head>
    <body>{children}</body></html>
  )
}
