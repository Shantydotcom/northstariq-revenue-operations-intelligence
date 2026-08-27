import 'server-only';

import { deflateRawSync, crc32 } from 'node:zlib';

/**
 * CSV and XLSX writers, built on the Node standard library.
 *
 * No spreadsheet dependency is added. PRODUCT.md holds the runtime dependency
 * floor at four packages and treats that restraint as part of the argument, so
 * a workbook is assembled here rather than pulling in a library that would
 * dwarf the application it serves.
 *
 * An .xlsx file is a ZIP of five small XML parts. Cell values are written as
 * inline strings, which removes the shared-string table and keeps the writer
 * to one readable pass.
 */

export interface Sheet {
  /** Worksheet name. Excel forbids : \ / ? * [ ] and caps the name at 31 chars. */
  name: string;
  header: string[];
  rows: (string | number | null)[][];
}

/* --------------------------------------------------------------- csv */

/** RFC 4180: quote when the value contains a comma, quote, or newline. */
function csvCell(value: string | number | null): string {
  if (value === null) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * One CSV document. A workbook with several sheets is written as consecutive
 * labelled blocks separated by a blank line, because CSV has no sheet concept
 * and silently dropping the second block would lose substantiated evidence.
 *
 * The UTF-8 BOM is deliberate: without it Excel misreads the non-ASCII
 * characters this application uses in field values.
 */
export function toCsv(sheets: Sheet[]): string {
  const blocks = sheets.map((sheet, i) => {
    const lines: string[] = [];
    if (sheets.length > 1) lines.push(csvCell(`# ${sheet.name}`));
    lines.push(sheet.header.map(csvCell).join(','));
    for (const row of sheet.rows) lines.push(row.map(csvCell).join(','));
    return (i > 0 ? '\r\n' : '') + lines.join('\r\n');
  });
  return '﻿' + blocks.join('\r\n') + '\r\n';
}

/* -------------------------------------------------------------- xlsx */

const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPE[c]);
}

/** Strip characters XML 1.0 forbids outright, rather than emitting a corrupt file. */
function xmlSafe(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) as number;
    // XML 1.0 permits tab, newline and carriage return; other C0 controls are illegal.
    const isTabOrBreak = code === 9 || code === 10 || code === 13;
    if (code < 32 && !isTabOrBreak) continue;
    out += ch;
  }
  return xml(out);
}

/** A1, B1 … Z1, AA1 — column index is zero-based. */
function cellRef(col: number, row: number): string {
  let name = '';
  let n = col;
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return `${name}${row}`;
}

function cell(col: number, row: number, value: string | number | null): string {
  if (value === null || value === '') return '';
  const ref = cellRef(col, row);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlSafe(String(value))}</t></is></c>`;
}

/** Excel rejects these characters in a sheet name and caps the length at 31. */
function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31) || 'Sheet';
}

function sheetXml(sheet: Sheet): string {
  const rows: string[] = [];

  const headerCells = sheet.header.map((h, c) => cell(c, 1, h)).join('');
  rows.push(`<row r="1">${headerCells}</row>`);

  sheet.rows.forEach((row, i) => {
    const r = i + 2;
    const cells = row.map((v, c) => cell(c, r, v)).join('');
    rows.push(`<row r="${r}">${cells}</row>`);
  });

  // Column widths sized from content so the workbook is readable on open.
  const widths = sheet.header
    .map((h, c) => {
      const longest = sheet.rows.reduce((max, row) => {
        const v = row[c];
        return Math.max(max, v === null ? 0 : String(v).length);
      }, h.length);
      return `<col min="${c + 1}" max="${c + 1}" width="${Math.min(Math.max(longest + 2, 10), 60)}" customWidth="1"/>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<cols>${widths}</cols>` +
    `<sheetData>${rows.join('')}</sheetData>` +
    `</worksheet>`
  );
}

interface ZipEntry {
  path: string;
  data: Buffer;
}

/**
 * Minimal ZIP writer — deflate, no data descriptors, no Zip64.
 *
 * Export volumes here are tens of rows, so the 4 GB and 65,535-entry ceilings
 * of the classic format are not reachable.
 */
function zip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, 'utf8');
    const compressed = deflateRawSync(entry.data);
    const sum = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0x21, 12); // date — fixed, so output is deterministic
    local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory header
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(sum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42); // relative offset of local header
    centrals.push(central, name);

    offset += local.length + name.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, centralBuf, end]);
}

export function toXlsx(sheets: Sheet[]): Buffer {
  const named = sheets.map((s) => ({ ...s, name: safeSheetName(s.name) }));

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    named
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('') +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>` +
    named
      .map((s, i) => `<sheet name="${xmlSafe(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('') +
    `</sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    named
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('') +
    `</Relationships>`;

  const buf = (s: string) => Buffer.from(s, 'utf8');

  return zip([
    { path: '[Content_Types].xml', data: buf(contentTypes) },
    { path: '_rels/.rels', data: buf(rootRels) },
    { path: 'xl/workbook.xml', data: buf(workbook) },
    { path: 'xl/_rels/workbook.xml.rels', data: buf(workbookRels) },
    ...named.map((s, i) => ({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: buf(sheetXml(s)),
    })),
  ]);
}

/* ------------------------------------------------------------ shared */

export type ExportFormat = 'csv' | 'xlsx';

export function isExportFormat(value: string | null): value is ExportFormat {
  return value === 'csv' || value === 'xlsx';
}

/** Safe for a Content-Disposition filename and for Windows and macOS alike. */
export function exportFilename(base: string, stampIso: string, format: ExportFormat): string {
  const stamp = stampIso.slice(0, 16).replace(/[:T]/g, '-');
  const safe = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-');
  return `${safe}-${stamp}.${format}`;
}

export function exportHeaders(filename: string, format: ExportFormat): HeadersInit {
  return {
    'Content-Type':
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    // An export is a point-in-time observation; never let one be replayed.
    'Cache-Control': 'no-store',
  };
}
