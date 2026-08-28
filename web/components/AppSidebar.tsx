'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SalesforceStatus } from '@/lib/types';
import {
  AnalyticsIcon,
  AssessmentIcon,
  AuditIcon,
  ChevronLeftIcon,
  CloudIcon,
  DashboardIcon,
  FindingsIcon,
  IntegrationsIcon,
  RemediationIcon,
  SettingsIcon,
  StarMark,
  VerificationIcon,
} from './Icons';

/**
 * The application shell's navigation.
 *
 * The sidebar states the whole control lifecycle - assess, investigate,
 * remediate, verify, analyse - because that progression IS the product
 * argument. Three of those stages are built; the rest are architecture.
 *
 * SO THE UNBUILT ONES ARE NOT LINKS. A destination that renders an empty page
 * is worse than one that says it does not exist yet: it costs a click to learn
 * nothing, and it quietly implies capability the repository does not have.
 * They render as non-interactive rows carrying a "Planned" tag, stay out of the
 * tab order, and are marked `aria-disabled` so a screen reader hears the same
 * thing a sighted reader sees. No route, no placeholder, no broken link.
 */

interface Item {
  label: string;
  hint: string;
  icon: (p: { className?: string }) => React.ReactElement;
  /** Absent where the destination is approved architecture but not built. */
  href?: string;
}

interface Group {
  heading: string;
  items: Item[];
}

const GROUPS: Group[] = [
  {
    heading: 'Control lifecycle',
    items: [
      { label: 'Dashboard', hint: 'At a glance', icon: DashboardIcon },
      {
        label: 'Assessment',
        hint: 'Run & review assessments',
        icon: AssessmentIcon,
        href: '/',
      },
      { label: 'Findings', hint: 'Investigate issues', icon: FindingsIcon, href: '/findings' },
      { label: 'Remediation', hint: 'Correct & track', icon: RemediationIcon },
      { label: 'Verification', hint: 'Reassess & confirm', icon: VerificationIcon },
    ],
  },
  {
    heading: 'Intelligence',
    items: [{ label: 'Analytics', hint: 'Trends & reporting', icon: AnalyticsIcon }],
  },
  {
    heading: 'System',
    items: [
      {
        label: 'Integrations',
        hint: 'Salesforce & Power BI',
        icon: IntegrationsIcon,
        href: '/integrations',
      },
      { label: 'Audit Log', hint: 'Activity history', icon: AuditIcon },
      { label: 'Settings', hint: 'Preferences', icon: SettingsIcon },
    ],
  },
];

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export default function AppSidebar({ status }: { status: SalesforceStatus }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
      <Link className="brand" href="/">
        <StarMark className="brand-star" />
        <span className="brand-text">
          <span className="brand-name">
            NORTHSTAR<span> IQ</span>
          </span>
          <span className="brand-sub">Revenue Operations Intelligence</span>
        </span>
      </Link>

      <nav className="side-nav" aria-label="Main">
        {GROUPS.map((group) => (
          <div className="nav-group" key={group.heading}>
            <p className="nav-heading" aria-hidden={collapsed}>
              {group.heading}
            </p>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.href ? isActive(pathname, item.href) : false;

                if (!item.href) {
                  return (
                    <li key={item.label}>
                      <span className="nav-item is-planned" aria-disabled="true">
                        <Icon className="nav-icon" />
                        <span className="nav-text">
                          <span className="nav-label">
                            {item.label}
                            <span className="nav-planned">Planned</span>
                          </span>
                          <span className="nav-hint">{item.hint}</span>
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
                      title={collapsed ? `${item.label} — ${item.hint}` : undefined}
                    >
                      <Icon className="nav-icon" />
                      <span className="nav-text">
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-hint">{item.hint}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/*
       * The connection, restated where the reader already is.
       *
       * Live state, never a hard-coded "Connected" - a panel that claims a
       * connection the application does not have is the one thing this rail
       * must never do.
       */}
      <div className={`side-conn${status.connected ? '' : ' is-down'}`}>
        <p className="side-conn-top">
          <CloudIcon className="side-conn-cloud" />
          <span>Salesforce</span>
        </p>
        <p className="side-conn-state">
          <span className="side-dot" aria-hidden="true" />
          {status.connected
            ? 'Connected'
            : status.configured
              ? 'Unavailable'
              : 'Not configured'}
        </p>
        <p className="side-conn-note">Read-only assessment</p>
      </div>

      <button type="button" className="side-collapse" onClick={toggle} aria-pressed={collapsed}>
        <ChevronLeftIcon className="side-collapse-icon" />
        <span className="side-collapse-text">Collapse</span>
        <span className="sr-only"> the navigation sidebar</span>
      </button>
    </aside>
  );
}
