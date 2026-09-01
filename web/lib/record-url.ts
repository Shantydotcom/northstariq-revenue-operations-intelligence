/**
 * The Salesforce record URL rule, in one place.
 *
 * Extracted from `salesforce.ts` so the browser can use the same rule the
 * server already uses. Nothing here reaches Salesforce - it is a string shape
 * plus an id guard - and `salesforce.ts` re-exports it, so there is still one
 * definition rather than one per side of the boundary.
 *
 * The host always comes from the token response held server-side and is passed
 * in; it is never taken from anything the browser sent, and no credential ever
 * appears in a URL.
 */
export function recordUrl(instanceHost: string | undefined, recordId: string): string | null {
  if (!instanceHost || !/^[a-zA-Z0-9]{15,18}$/.test(recordId)) return null;
  return `https://${instanceHost}/lightning/r/${recordId}/view`;
}
