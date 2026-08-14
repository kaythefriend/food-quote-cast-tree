import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Food Quote Cast Tree',
  description: 'Explore how food conversations spread through Farcaster quote casts.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}