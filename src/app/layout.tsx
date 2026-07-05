import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: { default: 'Kettesben — randiötletek pároknak', template: '%s · Kettesben' },
  description:
    'Páros randiötlet-gyűjtemény és randinapló: inspiráció, bakancslisták, közös emlékek és partnerkedvezmények — minden korosztályú párnak.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-stone-500">
            <p>
              💛 <strong>Kettesben</strong> — nem csak az összejövést segíti, az együtt maradást is.
            </p>
            <nav className="flex gap-4">
              <Link href="/otletek" className="hover:text-rose-600">Ötletek</Link>
              <Link href="/bakancslistak" className="hover:text-rose-600">Bakancslisták</Link>
              <Link href="/partnerek" className="hover:text-rose-600">Partnerek</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
