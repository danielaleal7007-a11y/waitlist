import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SMM Panel - Social Media Marketing Services',
  description: 'Professional SMM panel for Instagram, TikTok, YouTube, Facebook and more. Boost your social media presence with high-quality services.',
  keywords: 'smm panel, social media marketing, instagram followers, tiktok likes, youtube views',
  authors: [{ name: 'SMM Panel' }],
  openGraph: {
    title: 'SMM Panel - Social Media Marketing Services',
    description: 'Professional SMM panel for all major social platforms',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
