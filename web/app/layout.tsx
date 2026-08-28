import type { Metadata } from 'next';
import './globals.css';
import { getStatus } from '@/lib/salesforce';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'NorthstarIQ — Revenue Operations Intelligence',
  description:
    'Read-only revenue operations assessment over a governed Salesforce inbound process.',
};

/**
 * The application shell: a permanent navy rail, a status header, and a canvas.
 *
 * The connection is read here rather than per page, because it belongs to the
 * shell in both approved mockups - the sidebar panel and the header line are
 * the same fact stated in the two places a reader looks. `getStatus` already
 * fails closed and returns a shape rather than throwing, so a Salesforce
 * outage degrades the header instead of taking the layout down with it.
 */
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const status = await getStatus();

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>

        <div className="app">
          <AppSidebar status={status} />

          <div className="app-main">
            <AppHeader status={status} />

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
