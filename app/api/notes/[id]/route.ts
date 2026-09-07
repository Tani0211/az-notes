import {
  apiUser,
  validateNote,
  db,
  json,
  errorResponse,
  ApiError,
  findNote,
} from '../../../../lib/server';
import { verifyStoredPdf } from '../../../../lib/storage';
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiUser(req, true);
    const { id } = await params;
    if (!(await findNote(id, true)))
      throw new ApiError('Lecture not found.', 404);
    if (Number(req.headers.get('content-length')) > 15000)
      throw new ApiError('Lecture details are too long.');
    const n = validateNote(await req.json());
    if (n.fileKey) await verifyStoredPdf(n.fileKey);
    await db()
      .prepare(
        'UPDATE notes SET title=?,topic=?,date=?,week=?,phase=?,summary=?,driveUrl=?,codeUrl=?,fileKey=?,status=?,updatedAt=? WHERE id=?',
      )
      .bind(
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
        id,
      )
      .run();
    return json({ id });
  } catch (e) {
    return errorResponse(e);
  }
}
