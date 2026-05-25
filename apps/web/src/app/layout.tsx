import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from './providers'

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
        className="font-body antialiased"
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
