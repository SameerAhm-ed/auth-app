import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Artistic Milliners Dashboard',
    short_name: 'EMS',
    description: 'Energy management & monitoring dashboard',
    // '/login' resolves for everyone: an authed session is bounced straight to
    // the dashboard by the proxy, a logged-out user sees login. '/dashboard'
    // would 307-redirect for logged-out users, so the installed app would open
    // onto a redirect.
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3f3f46',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
