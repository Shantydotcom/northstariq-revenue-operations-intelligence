'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { readStoredResult } from '@/lib/assessment-store';
import { NAV_GROUPS, type NavIcon } from '@/lib/navigation';
import {
  AnalyticsIcon,
  AssessmentIcon,
  AuditIcon,
  ChevronLeftIcon,
  DashboardIcon,
  FindingsIcon,
  IntegrationsIcon,
  StarMark,
} from './Icons';

/**
 * The application shell's navigation.
 *
 * What the rows ARE lives in `lib/navigation.ts`, where the test suite can
 * reach it. This file owns only how they render.
 *
 * A row without an `href` is approved architecture that is not built, and it is
 * NOT A LINK. A destination that renders an empty page is worse than one that
 * says it does not exist yet: it costs a click to learn nothing, and it quietly
 * implies capability the repository does not have. Those rows are
 * non-interactive, carry a "Planned" tag, stay out of the tab order, and are
 * marked `aria-disabled` so a screen reader hears what a sighted reader sees.
 * No route, no placeholder, no broken link.
 */

const ICONS: Record<NavIcon, (p: { className?: string }) => React.ReactElement> = {
  dashboard: DashboardIcon,
  assessment: AssessmentIcon,
  findings: FindingsIcon,
  analytics: AnalyticsIcon,
  integrations: IntegrationsIcon,
  audit: AuditIcon,
};

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export default function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  /**
   * How many findings the completed assessment raised, or null before one.
   *
   * Read once after mount from the same store the pages read. It is never a
   * placeholder: with no completed run there is no badge at all, because a
   * count nothing produced would be a number the reader could not trace.
   */
  const [findings, setFindings] = useState<number | null>(null);

  useEffect(() => {
    const stored = readStoredResult();
    setFindings(stored ? stored.findingCount : null);
  }, [pathname]);

  /*
   * The collapsed choice belongs to the reader, not to the session. It is the
   * one piece of state here worth keeping across a navigation, and it is a
   * per-viewer convenience - so sessionStorage, guarded, and never a cookie.
   */
  useEffect(() => {
    try {
      setCollapsed(sessionStorage.getItem('northstariq.sidebar') === 'collapsed');
    } catch {
      /* private mode, blocked storage - the default is correct */
    }
  }, []);

  const toggle = () => {
    setCollapsed((was) => {
      const next = !was;
      try {
        sessionStorage.setItem('northstariq.sidebar', next ? 'collapsed' : 'expanded');
      } catch {
        /* nothing to persist to; the interaction still works */
      }
      return next;
    });
  };

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`} data-collapsed={collapsed}>
      {/*
       * The wordmark is the way home, from every page.
       *
       * It carries its own accessible name rather than borrowing one from its
       * contents. Two reasons: the composed name read as
       * "NORTHSTAR IQRevenue Operations Intelligence", and the collapsed rail
       * hides `.brand-text` entirely while the star is decorative - which left
       * the link with NO accessible name at all whenever the sidebar was
       * collapsed.
       */}
      <Link className="brand" href="/" aria-label="NorthstarIQ home">
        <StarMark className="brand-star" />
        <span className="brand-text">
          <span className="brand-name">
            NORTHSTAR<span> IQ</span>
          </span>
          <span className="brand-sub">Revenue Operations Intelligence</span>
        </span>
      </Link>

      <nav className="side-nav" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.heading}>
            <p className="nav-heading" aria-hidden={collapsed}>
              {group.heading}
            </p>
            <ul>
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = item.href ? isActive(pathname, item.href) : false;

                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className="nav-item is-planned" aria-disabled="true">
                        <Icon className="nav-icon" />
                        <span className="nav-label">
                          {item.label}
                          <span className="nav-planned">Planned</span>
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      className={`nav-item${active ? ' is-active' : ''}`}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                      {item.label === 'Findings' && findings !== null && findings > 0 ? (
                        <span className="nav-count">
                          {findings}
                          <span className="sr-only"> findings need attention</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>


      <button type="button" className="side-collapse" onClick={toggle} aria-pressed={collapsed}>
        <ChevronLeftIcon className="side-collapse-icon" />
        <span className="side-collapse-text">Collapse</span>
        <span className="sr-only"> the navigation sidebar</span>
      </button>
    </aside>
  );
}
