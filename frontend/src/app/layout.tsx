import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './provider'

/**
 * Preserve the existing app structure while defaulting to the new light theme.
 * The app still supports a manual dark toggle, but the default StockDz theme
 * is the premium blue + white experience requested.
 */
const themeInitScript = `(function(){try{var stored=localStorage.getItem('theme');var dark=stored==='dark';document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme = dark ? 'dark' : 'light';}catch(e){document.documentElement.style.colorScheme='light';}})();`

export const metadata: Metadata = {
  title: 'StockDZ',
  description: 'Manage your stock, sales and operations from one workspace.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* MUST be first: sets the theme class before paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
