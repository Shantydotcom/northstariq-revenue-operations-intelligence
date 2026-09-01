import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppSidebar from '@/components/AppSidebar';

/*
 * Inter, self-hosted at build time by next/font. No package was added - this
 * ships inside Next - and no request leaves the reader's browser for it.
 *
 * It is here for two things the system stack cannot do: a real medium weight,
 * and tabular figures. Every population count on the assessment sits in a
 * column, and proportional digits do not line up in one.
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'NorthstarIQ — Revenue Operations Intelligence',
  description:
    'Read-only revenue operations assessment over a governed Salesforce inbound process.',
};

/**
 * The application shell: a permanent navy rail and a canvas.
 *
 * THE CONNECTION IS NOT STATED HERE. Salesforce connection and read-only
 * status belong to Integrations, which already carries them in full - the
 * status pill, the connected-org card and the credential handling notes. A
 * shell line repeating "Salesforce connected · Read-only assessment" above
 * every page put integration state where the reader was looking for a result,
 * and neither approved reference shows it.
 */
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <div className="app">
          <AppSidebar />

          <div className="app-main">
            <main className="page" id="main">
              {children}
            </main>

            {/* Synthetic data must be identifiable wherever it surfaces. */}
            <p className="app-foot">
              Portfolio demonstration. All companies, people and records are fictional. This
              application reads Salesforce and never writes to it.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
