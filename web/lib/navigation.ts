/**
 * WHAT THE SIDEBAR OFFERS, AS DATA.
 *
 * Held here rather than inside the component for the same reason the check
 * presentation and the Salesforce traceability map are: what the application
 * claims to contain is a contract worth asserting, and a `.tsx` component is
 * not reachable from this project's test runner. The component owns how these
 * rows look; this owns what they are.
 *
 * A row without an `href` is approved architecture that is NOT BUILT. It
 * renders as a non-interactive "Planned" row, never as a link, because a
 * destination that resolves to an empty page costs a click to learn nothing
 * and quietly implies capability the repository does not have.
 *
 * REMEDIATION AND VERIFICATION ARE DELIBERATELY ABSENT.
 *
 * They are not missing pages. They are stages of the investigation trail for a
 * single finding, and they live inside Finding Detail beneath the safeguard
 * they concern. Listing them here - even as Planned - would advertise two
 * standalone workflows this MVP does not have and should not claim: NorthstarIQ
 * reads Salesforce and never writes to it, so it executes no remediation.
 */

export type NavIcon =
  | 'dashboard'
  | 'assessment'
  | 'findings'
  | 'analytics'
  | 'integrations'
  | 'audit';

export interface NavItem {
  label: string;
  icon: NavIcon;
  /** Absent where the destination is approved architecture but not built. */
  href?: string;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Control surface',
    items: [
      { label: 'Dashboard', icon: 'dashboard', href: '/' },
      { label: 'Assessment', icon: 'assessment', href: '/assessment' },
      { label: 'Findings', icon: 'findings', href: '/findings' },
    ],
  },
  {
    heading: 'Intelligence',
    items: [{ label: 'Analytics', icon: 'analytics' }],
  },
  {
    heading: 'System',
    items: [
      { label: 'Integrations', icon: 'integrations', href: '/integrations' },
      { label: 'Audit Log', icon: 'audit' },
    ],
  },
];
