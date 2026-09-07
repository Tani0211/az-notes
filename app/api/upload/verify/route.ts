import { apiUser, json, errorResponse } from '../../../../lib/server';
import { verifyStoredPdf } from '../../../../lib/storage';

export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    const body = (await req.json()) as { pathname?: unknown };
    const pathname = typeof body.pathname === 'string' ? body.pathname : '';
    const metadata = await verifyStoredPdf(pathname);
    return json({ key: metadata.pathname, size: metadata.size });
  } catch (e) {
    return errorResponse(e);
  }
}
