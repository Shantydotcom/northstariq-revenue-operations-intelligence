'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { EvidenceColumn, EvidenceRow } from '@/lib/types';

/**
 * A record table with per-column filtering and progressive disclosure.
 *
 * FILTERING IS A VIEW OPERATION AND NOTHING ELSE. It narrows the rows already
 * on the page; it issues no request, changes no population, and cannot alter a
 * count or a score. The assessment figures above the table are computed from
 * the full result and are deliberately not passed here. Exports go to the
 * server against the full dataset, so a collapsed or filtered view never
 * narrows the file a reader downloads.
 *
 * Five rows by default. A finding page is an investigation, not a record
 * browser: a 45-row table pushes the dependency and control sections off the
 * screen, and the reader who wants all of them can say so.
 *
 * Record links arrive pre-resolved from the server: `recordUrl` lives behind
 * the `server-only` Salesforce boundary, so the href cannot be built here
 * without duplicating the rule that builds it.
 *
 * PROVING EVIDENCE IS MARKED, NOT MERELY ORDERED. A column flagged `proving`
 * carries a value the control's failing predicate actually read; the rest are
 * context. Both are worth showing - an operator investigating needs the
 * Company and the routing reason - but a reader must be able to tell which
 * values produced the determination and which merely accompany it. The
 * distinction is carried in the accessible name as well as the styling, so it
 * survives without colour.
 */

/** Rows shown before the reader asks for the rest. */
const DEFAULT_ROWS = 5;

export default function RecordTable({
  columns,
  rows,
  hrefs,
  label,
  exportBase,
}: {
  columns: EvidenceColumn[];
  rows: EvidenceRow[];
  /** Salesforce record URL per row, index-aligned. `null` where unavailable. */
  hrefs: (string | null)[];
  /** Names what is being filtered, for accessible labels. */
  label: string;
  /** Export route for this table. Omitted where the table has no export. */
  exportBase?: string;
}) {
  /** Column key -> the text typed against that column. */
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [openColumn, setOpenColumn] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();

  // A popover that survives a click elsewhere reads as a stuck overlay.
  useEffect(() => {
    if (!menuOpen && openColumn === null) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuOpen && !menuRef.current?.contains(t)) setMenuOpen(false);
      if (openColumn !== null && !headRef.current?.contains(t)) setOpenColumn(null);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      setOpenColumn(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen, openColumn]);

  // Focus the field once it exists, not while it is still unmounted.
  useEffect(() => {
    if (openColumn !== null) inputRef.current?.focus();
  }, [openColumn]);

  const active = Object.entries(filters).filter(([, v]) => v.trim() !== '');

  const matched = useMemo(() => {
    const withHref = rows.map((row, i) => ({ row, href: hrefs[i] ?? null }));
    if (active.length === 0) return withHref;
    // Every active column must match - filters narrow together, they do not
    // compete. Two filters returning the union would be a surprising table.
    return withHref.filter(({ row }) =>
      active.every(([key, value]) =>
        String(row[key] ?? '').toLowerCase().includes(value.trim().toLowerCase()),
      ),
    );
  }, [rows, hrefs, active]);

  // Collapsing back to five is the right default whenever the set changes.
  useEffect(() => {
    setExpanded(false);
  }, [active.length]);

  if (rows.length === 0) {
    return <div className="empty">No records to show.</div>;
  }

  const visible = expanded ? matched : matched.slice(0, DEFAULT_ROWS);
  const filtering = active.length > 0;
  const noun = matched.length === 1 ? 'record' : 'records';

  function setFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilter(key: string) {
    setFilters((f) => {
      const next = { ...f };
      delete next[key];
      return next;
    });
  }

  const labelOf = (key: string) => columns.find((c) => c.key === key)?.label ?? key;
  const hasProving = columns.some((c) => c.proving);

  return (
    <>
      <div className="table-actions" ref={menuRef}>
        {exportBase ? (
          <>
            <button
              type="button"
              className="actions-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
            >
              Actions
              <span aria-hidden="true"> ▾</span>
            </button>
            {menuOpen ? (
              <div className="actions-menu" id={menuId} role="menu">
                <a
                  role="menuitem"
                  href={`${exportBase}?format=xlsx`}
                  onClick={() => setMenuOpen(false)}
                >
                  Export Excel
                  <span className="sr-only"> — download all {label} as an Excel workbook</span>
                </a>
                <a
                  role="menuitem"
                  href={`${exportBase}?format=csv`}
                  onClick={() => setMenuOpen(false)}
                >
                  Export CSV
                  <span className="sr-only"> — download all {label} as CSV</span>
                </a>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/*
       * Active filters live outside the header popovers. A filter a reader has
       * to reopen a menu to discover is one they cannot tell is still applied.
       */}
      {filtering ? (
        <div className="filter-chips">
          <span className="filter-chips-label">Filtered by</span>
          {active.map(([key, value]) => (
            <span className="filter-chip" key={key}>
              {labelOf(key)}: <strong>{value}</strong>
              <button type="button" onClick={() => clearFilter(key)}>
                <span aria-hidden="true">×</span>
                <span className="sr-only">Clear the {labelOf(key)} filter</span>
              </button>
            </span>
          ))}
          <button type="button" className="filter-clear-all" onClick={() => setFilters({})}>
            Clear all
          </button>
        </div>
      ) : null}

      {hasProving ? (
        <p className="proving-legend">
          <span className="proving-key" aria-hidden="true" />
          Marked columns are the values this control&rsquo;s determination turns on. The rest are
          context for investigating the record, and did not decide the result.
        </p>
      ) : null}

      {matched.length === 0 ? (
        <div className="empty">No records match the current filters.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead ref={headRef}>
              <tr>
                {columns.map((c) => {
                  const value = filters[c.key] ?? '';
                  const isActive = value.trim() !== '';
                  const isOpen = openColumn === c.key;
                  return (
                    <th
                      key={c.key}
                      className={
                        [isActive ? 'col-filtered' : '', c.proving ? 'col-proving' : '']
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                    >
                      <button
                        type="button"
                        className="col-filter-trigger"
                        aria-haspopup="dialog"
                        aria-expanded={isOpen}
                        onClick={() => setOpenColumn(isOpen ? null : c.key)}
                      >
                        {c.label}
                        {c.proving ? (
                          <span className="sr-only">
                            {' '}
                            — proving evidence, read by this control to reach its result
                          </span>
                        ) : null}
                        <span aria-hidden="true" className="col-filter-caret">
                          {isActive ? '▾●' : '▾'}
                        </span>
                        <span className="sr-only">
                          {isActive ? ` — filtered by ${value}. Change filter` : ' — filter this column'}
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="col-filter-pop" role="dialog" aria-label={`Filter ${c.label}`}>
                          <input
                            ref={inputRef}
                            type="search"
                            value={value}
                            placeholder={`Contains…`}
                            aria-label={`Filter ${label} by ${c.label}`}
                            onChange={(e) => setFilter(c.key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setOpenColumn(null);
                            }}
                          />
                          <button type="button" onClick={() => clearFilter(c.key)}>
                            Clear
                            <span className="sr-only"> the {c.label} filter</span>
                          </button>
                        </div>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map(({ row, href }, i) => (
                <tr key={String(row.Id ?? i)}>
                  {columns.map((c) => {
                    const value = row[c.key];
                    const display = value === null || value === '' ? '—' : String(value);
                    // One link per row, on the name a reader recognises. The Id
                    // stays visible as text because it is the value Salesforce
                    // holds, but an 18-character key is not something to click.
                    const linked = href !== null && c.key === 'Name';
                    return (
                      <td
                        key={c.key}
                        className={
                          [c.mono ? 'mono' : '', c.proving ? 'col-proving' : '']
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                      >
                        {linked ? (
                          <a className="record-link" href={href} target="_blank" rel="noreferrer">
                            {display}
                            <span aria-hidden="true"> ↗</span>
                            <span className="sr-only"> (opens in Salesforce)</span>
                          </a>
                        ) : (
                          display
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/*
       * The count says whether it counts everything or only what matched, so
       * "12 records" after filtering cannot be read as the whole population.
       */}
      {matched.length > DEFAULT_ROWS ? (
        <p className="table-more">
          <button type="button" onClick={() => setExpanded((e) => !e)}>
            {expanded
              ? 'Show less'
              : `View all ${matched.length} ${filtering ? `matching ${noun}` : noun}`}
          </button>
          <span className="muted">
            {expanded
              ? `Showing all ${matched.length}${filtering ? ` matching of ${rows.length}` : ''}`
              : `Showing ${visible.length} of ${matched.length}${filtering ? ` matching of ${rows.length}` : ''}`}
          </span>
        </p>
      ) : filtering ? (
        <p className="table-more">
          <span className="muted">
            Showing {matched.length} matching of {rows.length}
          </span>
        </p>
      ) : null}
    </>
  );
}
