'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Three routes. The product story is Overview -> Findings -> Integrations. */
const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/findings', label: 'Findings' },
  { href: '/integrations', label: 'Integrations' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav>
      {LINKS.map(({ href, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
