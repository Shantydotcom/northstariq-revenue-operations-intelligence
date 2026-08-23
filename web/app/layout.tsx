import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'NorthstarIQ — Revenue Operations Intelligence',
  description:
    'Read-only revenue operations assessment over a governed Salesforce inbound process.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="masthead">
          <div className="masthead-inner">
            <a className="wordmark" href="/">
              Northstar<span>IQ</span>
            </a>
            <Nav />
          </div>
        </header>

        {/* Synthetic data must be identifiable wherever it surfaces. */}
        <div className="demo-banner">
          <div>
            Portfolio demonstration. All companies, people and records are fictional. The
            application is read-only and never writes to Salesforce.
          </div>
        </div>

        <main className="page">{children}</main>
      </body>
    </html>
  );
}
