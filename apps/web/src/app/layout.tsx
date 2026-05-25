import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from './providers'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'LaunchPad — Mission Control for Founders',
  description:
    'Validate, build, and launch your startup idea with AI-powered insights.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash: apply saved theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('lp-theme');if(t!=='light'){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body
        className={`${syne.variable} ${dmSans.variable} font-body antialiased`}
        style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-modal)',
              border: '1px solid var(--border-ui)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
