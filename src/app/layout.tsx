import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { IosInstallHint } from '@/components/IosInstallHint'

export const metadata: Metadata = {
  title: 'Artistic Milliners Dashboard',
  description: 'Energy management & monitoring dashboard',
  applicationName: 'EMS',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'EMS' },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#3f3f46',
  viewportFit: 'cover', // let content extend under notches; we pad with safe-area insets
}

// Runs before paint to set the theme class, avoiding a light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
        <IosInstallHint />
      </body>
    </html>
  )
}
