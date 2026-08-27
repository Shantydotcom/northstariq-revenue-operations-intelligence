/**
 * Export controls.
 *
 * Plain links, not buttons: a download is a navigation, so an anchor gives
 * keyboard activation, middle-click and the browser's own download handling
 * without any client JavaScript. The route sets Content-Disposition, so no
 * `download` attribute is needed and the server names the file.
 */
export default function ExportLinks({ base, label }: { base: string; label: string }) {
  return (
    <span className="export-links">
      <span className="export-label" aria-hidden="true">
        Export
      </span>
      <a href={`${base}?format=xlsx`}>
        Excel
        <span className="sr-only"> — download {label} as an Excel workbook</span>
      </a>
      <a href={`${base}?format=csv`}>
        CSV
        <span className="sr-only"> — download {label} as CSV</span>
      </a>
    </span>
  );
}
