/**
 * The icon set, hand-drawn as inline SVG.
 *
 * No icon package. Every glyph is one 20x20 stroked path family sharing the
 * same weight, cap and join, because the mockups' restraint comes from that
 * consistency rather than from any particular shape. Mixing a filled set, an
 * emoji and a line set is what makes an interface look assembled instead of
 * designed.
 *
 * All are presentational: the label beside them carries the meaning, so they
 * are hidden from assistive technology rather than duplicating it.
 */

type IconProps = { className?: string };

/** Shared frame. 1.6 stroke reads correctly at 18-20px without smearing. */
function Glyph({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * The Northstar.
 *
 * A four-point star with a long vertical axis - the navigational star of the
 * mockups, not a generic sparkle. Filled rather than stroked because it is the
 * identity mark, and it is the one place a solid form is correct.
 */
export function StarMark({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 0.5c.6 6.7 2.2 10.6 4.6 12.4 1.8 1.4 5.3 2.3 10.9 3.1-5.6.8-9.1 1.7-10.9 3.1-2.4 1.8-4 5.7-4.6 12.4-.6-6.7-2.2-10.6-4.6-12.4C9.6 17.7 6.1 16.8.5 16c5.6-.8 9.1-1.7 10.9-3.1C13.8 11.1 15.4 7.2 16 .5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 8.4 10 3l7 5.4V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.4Z" />
      <path d="M8 17v-5h4v5" />
    </Glyph>
  );
}

export function AssessmentIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <rect x="4" y="3" width="12" height="14" rx="1.6" />
      <path d="M7.5 3h5a1 1 0 0 1 1 1v1h-7V4a1 1 0 0 1 1-1Z" />
      <path d="m7.5 11 1.8 1.8L13 9" />
    </Glyph>
  );
}

export function FindingsIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="9" cy="9" r="5.2" />
      <path d="m13 13 4 4" />
    </Glyph>
  );
}

export function RemediationIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="m3 17 5-5" />
      <path d="M12.5 3.2a3.6 3.6 0 0 0-4.3 4.6l-.9.9a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l.9-.9a3.6 3.6 0 0 0 4.6-4.3l-1.9 1.9-1.6-.4-.4-1.6 1.9-1.9Z" />
    </Glyph>
  );
}

export function VerificationIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M10 2.6 16 5v5.1c0 3.4-2.4 6.3-6 7.3-3.6-1-6-3.9-6-7.3V5l6-2.4Z" />
      <path d="m7.6 10 1.7 1.7 3.3-3.4" />
    </Glyph>
  );
}

export function AnalyticsIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 17h14" />
      <path d="M6 17V9.5" />
      <path d="M10 17V4.5" />
      <path d="M14 17v-5" />
    </Glyph>
  );
}

export function IntegrationsIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5.6 15.5a3.6 3.6 0 0 1-.5-7.2 4.7 4.7 0 0 1 9.1-1.1 3.4 3.4 0 0 1 .3 6.8" />
      <path d="M10 10.5v6" />
      <path d="m7.8 14.3 2.2 2.2 2.2-2.2" />
    </Glyph>
  );
}

export function AuditIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M5 2.6h6.5L16 7v10.4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.6a1 1 0 0 1 1-1Z" />
      <path d="M11.2 2.8V7H15.6" />
      <path d="M7 11h6M7 14h4" />
    </Glyph>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M15.6 12.2a1.2 1.2 0 0 0 .24 1.32l.04.05a1.45 1.45 0 1 1-2.05 2.05l-.05-.05a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.73 1.1v.13a1.45 1.45 0 1 1-2.9 0v-.07a1.2 1.2 0 0 0-.79-1.1 1.2 1.2 0 0 0-1.32.24l-.05.05a1.45 1.45 0 1 1-2.05-2.05l.05-.05a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.73H3.6a1.45 1.45 0 1 1 0-2.9h.07a1.2 1.2 0 0 0 1.1-.79 1.2 1.2 0 0 0-.24-1.32l-.05-.05a1.45 1.45 0 1 1 2.05-2.05l.05.05a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 .73-1.1V3.6a1.45 1.45 0 1 1 2.9 0v.07a1.2 1.2 0 0 0 .73 1.1 1.2 1.2 0 0 0 1.32-.24l.05-.05a1.45 1.45 0 1 1 2.05 2.05l-.05.05a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.73h.13a1.45 1.45 0 1 1 0 2.9h-.07a1.2 1.2 0 0 0-1.1.73Z" />
    </Glyph>
  );
}

/** The Salesforce cloud, drawn rather than imported. */
export function CloudIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 16"
      width="22"
      height="15"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.6 2.1a4.3 4.3 0 0 1 6.5.9 3.8 3.8 0 0 1 1.6-.35 3.85 3.85 0 0 1 3.6 2.5 3.6 3.6 0 0 1-1.3 6.95H6.3A4.55 4.55 0 0 1 5.4 3.1a4.3 4.3 0 0 1 4.2-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="m12 4-5 6 5 6" />
    </Glyph>
  );
}

/** Filled tick in a disc. The one status glyph, used only for connected. */
export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path
        d="m6.2 10.2 2.5 2.5 5.1-5.2"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Hollow ring. Used where the connection is not healthy, so shape differs. */
/**
 * The mark for an outcome nothing could settle.
 *
 * Drawn with the same `Glyph` wrapper as every other icon in this file - no
 * package, no asset. It exists because "Unable to determine" is a first-class
 * assessment outcome and reusing the alert glyph for it would have said the
 * same thing about two different states.
 */
export function HelpCircleIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="10" cy="10" r="7.6" />
      <path d="M7.9 7.8a2.15 2.15 0 1 1 2.9 2.02c-.5.19-.8.66-.8 1.19v.3" />
      <path d="M10 14.2h.01" />
    </Glyph>
  );
}

export function AlertCircleIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="10" cy="10" r="7.6" />
      <path d="M10 6.2v4.4" />
      <path d="M10 13.4h.01" />
    </Glyph>
  );
}

/* ------------------------------------------------ assessment area marks */

/**
 * One glyph per assessment area, in the same stroked family as the navigation.
 *
 * They sit in tinted discs on the Assessment Scope band. The colour is a
 * reading aid for scanning five columns, never the meaning: each disc is
 * labelled, and removing every colour would lose nothing a reader needs.
 */

/** Inbound Lead Data Integrity — people arriving. */
export function AreaLeadsIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="7.6" cy="7.4" r="2.7" />
      <path d="M3 16.4c0-2.3 2.1-3.8 4.6-3.8s4.6 1.5 4.6 3.8" />
      <path d="M13.4 5.2a2.5 2.5 0 0 1 0 4.6" />
      <path d="M14.6 12.9c1.5.5 2.6 1.7 2.6 3.5" />
    </Glyph>
  );
}

/** Lead Routing Reliability — a path that branches and rises. */
export function AreaRoutingIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M4 16.5V9.2a2.6 2.6 0 0 1 2.6-2.6H13" />
      <path d="m10.4 4 2.8 2.6-2.8 2.6" />
      <path d="M16 16.5v-4.2" />
      <path d="m13.8 14.2 2.2-2.2 2.2 2.2" />
    </Glyph>
  );
}

/** Account Match Confidence — the account itself. */
export function AreaAccountIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M4 17V4.6a1 1 0 0 1 1-1h6.4a1 1 0 0 1 1 1V17" />
      <path d="M12.4 8.6H16a1 1 0 0 1 1 1V17" />
      <path d="M3 17h14" />
      <path d="M6.6 7h3M6.6 10.2h3M6.6 13.4h3" />
    </Glyph>
  );
}

/** Lead Response SLA — elapsed time against a commitment. */
export function AreaSlaIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="10" cy="10.4" r="6.4" />
      <path d="M10 6.8v3.8l2.6 1.6" />
      <path d="M7.6 2.4h4.8" />
    </Glyph>
  );
}

/** Open Pipeline Date Health — pipeline over time. */
export function AreaPipelineIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <path d="M3 16.6h14" />
      <path d="M5.6 16.6v-3.4M9.2 16.6V8.6M12.8 16.6v-5.6M16.4 16.6V5.4" />
    </Glyph>
  );
}

/** The read-only padlock, for the safety notice. */
export function LockIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <rect x="4.4" y="8.8" width="11.2" height="8" rx="1.6" />
      <path d="M7.2 8.8V6.6a2.8 2.8 0 0 1 5.6 0v2.2" />
    </Glyph>
  );
}

/** A solid right-pointing triangle: the run action. */
export function PlayIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 2.8 13 8l-9 5.2V2.8Z" fill="currentColor" />
    </svg>
  );
}

/** Lifecycle Governance - staged progression along a governed path. */
export function AreaLifecycleIcon({ className }: IconProps) {
  return (
    <Glyph className={className}>
      <circle cx="4.4" cy="10" r="1.9" />
      <circle cx="10" cy="10" r="1.9" />
      <circle cx="15.6" cy="10" r="1.9" />
      <path d="M6.3 10h1.8M11.9 10h1.8" />
      <path d="M10 5.4V3.2" />
    </Glyph>
  );
}
