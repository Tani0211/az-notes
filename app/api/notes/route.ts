import {
  apiUser,
  listNotes,
  validateNote,
  db,
  json,
  errorResponse,
  ApiError,
} from '../../../lib/server';
import { verifyStoredPdf } from '../../../lib/storage';
export async function GET() {
  try {
    const u = await apiUser();
    return json(await listNotes(u.admin));
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    if (Number(req.headers.get('content-length')) > 15000)
      throw new ApiError('Lecture details are too long.');
    const n = validateNote(await req.json());
    if (n.fileKey) await verifyStoredPdf(n.fileKey);
    const id = crypto.randomUUID();
    await db()
      .prepare(
        'INSERT INTO notes (id,title,topic,date,week,phase,summary,driveUrl,codeUrl,fileKey,status,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        n.title,
        n.topic,
        n.date,
        n.week,
        n.phase,
        n.summary,
        n.driveUrl,
        n.codeUrl,
        n.fileKey,
        n.status,
        Date.now(),
      )
      .run();
    return json({ id }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
