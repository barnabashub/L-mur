import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Header } from '@/components/Header';
import { VerifyBanner } from '@/components/VerifyBanner';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: { default: 'Kettesben — randiötletek pároknak', template: '%s · Kettesben' },
  description:
    'Páros randiötlet-gyűjtemény és randinapló: inspiráció, bakancslisták, közös emlékek és partnerkedvezmények — minden korosztályú párnak.',
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Kettesben' },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0c16' },
  ],
};

// A téma beállítása még a festés előtt, hogy ne villanjon (FOUC).
const themeInit = `(function(){try{var t=localStorage.getItem('kettesben-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <VerifyBanner />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-edge bg-card">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-mute">
            <p className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span>
                <strong className="text-ink">Kettesben</strong> — nem csak az összejövést segíti, az
                együtt maradást is.
              </span>
            </p>
            <nav className="flex gap-4">
              <Link href="/otletek" className="hover:text-brand">Ötletek</Link>
              <Link href="/terkep" className="hover:text-brand">Térkép</Link>
              <Link href="/bakancslistak" className="hover:text-brand">Bakancslisták</Link>
              <Link href="/partnerek" className="hover:text-brand">Partnerek</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
