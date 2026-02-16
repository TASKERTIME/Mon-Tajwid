import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mon Tajwid — Apprends le Coran avec le Tajwid',
  description: 'Application gamifiée pour apprendre le Coran avec reconnaissance vocale et analyse du Tajwid',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
