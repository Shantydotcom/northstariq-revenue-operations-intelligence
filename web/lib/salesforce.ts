import 'server-only';

import type { SafeError, SafeErrorCode, SalesforceStatus } from './types.ts';

/**
 * The Salesforce boundary. Everything secret lives here and nowhere else.
 *
 * `server-only` makes importing this from a Client Component a build error, so
 * the credentials cannot reach the browser by accident. The env vars are also
 * deliberately un-prefixed: NEXT_PUBLIC_ would inline them into the client
 * bundle.
 *
 * Read-only by construction: the only Salesforce call this module can make is
 * a SOQL query. There is no create/update/delete path in this increment.
 */

interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  /** epoch ms */
  expiresAt: number;
}

/**
 * Module-scoped, in-memory only. Never a cookie, never localStorage, never
 * serialised into a page payload. A cold serverless start simply re-fetches.
 */
let tokenCache: TokenCache | null = null;

/** Salesforce access tokens are long-lived; re-fetch well before any doubt. */
const TOKEN_TTL_MS = 20 * 60 * 1000;

export class SalesforceError extends Error {
  code: SafeErrorCode;
  constructor(code: SafeErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'SalesforceError';
  }
}

interface Config {
  loginUrl: string;
  clientId: string;
  clientSecret: string;
  apiVersion: string;
}

/** Returns null when the org has not been configured yet - not an error. */
function readConfig(): Config | null {
  const loginUrl = process.env.SF_LOGIN_URL;
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const apiVersion = process.env.SF_API_VERSION ?? '67.0';

  if (!loginUrl || !clientId || !clientSecret) return null;
  return { loginUrl: loginUrl.replace(/\/+$/, ''), clientId, clientSecret, apiVersion };
}

export function isConfigured(): boolean {
  return readConfig() !== null;
}

/**
 * OAuth 2.0 Client Credentials Flow.
 *
 * Chosen over JWT Bearer because it needs no certificate and no PEM in an env
 * var, and over Username-Password because that flow needs a security token and
 * is being restricted. One org, one app, server-side only.
 */
async function getToken(): Promise<TokenCache> {
  const cfg = readConfig();
  if (!cfg) {
    throw new SalesforceError('NOT_CONFIGURED', 'Salesforce connection is not configured.');
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });

  let res: Response;
  try {
    res = await fetch(`${cfg.loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
  } catch {
    // Deliberately not echoing the caught error: it can contain the request body.
    throw new SalesforceError('NETWORK_ERROR', 'Could not reach Salesforce.');
  }

  if (!res.ok) {
    // Salesforce returns error_description here; it is not logged or forwarded,
    // because it can restate submitted credentials.
    throw new SalesforceError('AUTH_FAILED', 'Salesforce rejected the connection credentials.');
  }

  const json = (await res.json()) as { access_token?: string; instance_url?: string };
  if (!json.access_token || !json.instance_url) {
    throw new SalesforceError('AUTH_FAILED', 'Salesforce returned an unexpected token response.');
  }

  tokenCache = {
    accessToken: json.access_token,
    instanceUrl: json.instance_url.replace(/\/+$/, ''),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return tokenCache;
}

/**
 * Run a SOQL query. The only Salesforce operation this application performs.
 *
 * Callers build SOQL from literals in lib/soql.ts; no user input reaches this.
 */
export async function query<T>(soql: string): Promise<T[]> {
  const cfg = readConfig();
  if (!cfg) {
    throw new SalesforceError('NOT_CONFIGURED', 'Salesforce connection is not configured.');
  }

  const { accessToken, instanceUrl } = await getToken();
  const url = `${instanceUrl}/services/data/v${cfg.apiVersion}/query?q=${encodeURIComponent(soql)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
  } catch {
    throw new SalesforceError('NETWORK_ERROR', 'Could not reach Salesforce.');
  }

  if (res.status === 401) {
    // Token may have been revoked or expired early - drop it and fail cleanly.
    tokenCache = null;
    throw new SalesforceError('AUTH_FAILED', 'The Salesforce session is no longer valid.');
  }

  if (!res.ok) {
    // Salesforce error bodies can echo the query; surface only a class.
    throw new SalesforceError('API_ERROR', 'Salesforce could not complete the query.');
  }

  const json = (await res.json()) as { records?: T[] };
  return json.records ?? [];
}

/** Probe used by the Integrations screen. Never throws. */
export async function getStatus(): Promise<SalesforceStatus> {
  if (!isConfigured()) {
    return {
      connected: false,
      configured: false,
      environment: 'Developer Edition',
      reason:
        'Salesforce connection is not configured. Set SF_LOGIN_URL, SF_CLIENT_ID and SF_CLIENT_SECRET.',
    };
  }

  try {
    // A one-row read of an object the assessment already requires. Organization
    // is deliberately not probed: the least-privilege integration principal has
    // no access to it, so probing it reported Disconnected on a connection that
    // was working. A probe should test the access the application actually needs.
    await query<{ Id: string }>('SELECT Id FROM Lead LIMIT 1');
    const { instanceUrl } = await getToken();
    return {
      connected: true,
      configured: true,
      environment: 'Developer Edition',
      instanceHost: new URL(instanceUrl).host,
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      environment: 'Developer Edition',
      reason: toSafeError(err).message,
    };
  }
}

/** Map any thrown value to a safe, user-presentable shape. */
export function toSafeError(err: unknown): SafeError {
  if (err instanceof SalesforceError) return { code: err.code, message: err.message };
  return { code: 'UNKNOWN', message: 'An unexpected error occurred.' };
}

/**
 * Build a Salesforce record URL from the connected instance host only.
 *
 * Re-exported rather than defined here: the Assessment population panels run
 * in the browser and need the same rule, and this module is `server-only`.
 * One definition, reachable from both sides.
 */
export { recordUrl } from './record-url.ts';

/** The only objects this application reads, and so the only ones it links to. */
const LINKABLE_OBJECTS = new Set(['Lead', 'Opportunity', 'Account', 'Contact']);

/**
 * Build a Salesforce list-view URL for one object.
 *
 * Same rule as `recordUrl`: the host comes from the token response held
 * server-side, never from anything the browser sent, and the object name must
 * be one this application actually reads. No credential is ever placed in a URL.
 */
export function listViewUrl(instanceHost: string | undefined, object: string): string | null {
  if (!instanceHost || !LINKABLE_OBJECTS.has(object)) return null;
  return `https://${instanceHost}/lightning/o/${object}/list`;
}
