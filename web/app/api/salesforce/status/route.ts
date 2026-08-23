import { NextResponse } from 'next/server';
import { getStatus } from '@/lib/salesforce';

/** Read-only connection probe. getStatus() never throws, so this cannot 500. */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await getStatus());
}
