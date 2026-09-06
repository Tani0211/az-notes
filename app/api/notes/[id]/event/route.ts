import {
  apiUser,
  findNote,
  db,
  json,
  errorResponse,
  ApiError,
} from '../../../../../lib/server';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser(req);
    const { id } = await params;
    if (!(await findNote(id, user.admin)))
      throw new ApiError('Lecture not found.', 404);
    await db()
      .prepare(
        'INSERT OR IGNORE INTO events (userId,noteId,kind,bucket,createdAt) VALUES (?,?,?,?,?)',
      )
      .bind(
        user.userId,
        id,
        'view',
        Math.floor(Date.now() / 300000),
        Date.now(),
      )
      .run();
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
