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
    const input = (await req.json()) as Record<string, unknown>;
    const allowed = ['saved', 'completed', 'lastPage'];
    if (
      !Object.keys(input).length ||
      Object.keys(input).some((k) => !allowed.includes(k))
    )
      throw new ApiError('Invalid reading update.');
    for (const k of ['saved', 'completed'])
      if (k in input && typeof input[k] !== 'boolean')
        throw new ApiError('Invalid reading update.');
    if (
      'lastPage' in input &&
      (!Number.isInteger(input.lastPage) ||
        Number(input.lastPage) < 1 ||
        Number(input.lastPage) > 10000)
    )
      throw new ApiError('Enter a valid page.');
    const existing = await db()
      .prepare('SELECT * FROM reading WHERE userId=? AND noteId=?')
      .bind(user.userId, id)
      .first<{ saved: number; completed: number; lastPage: number }>();
    const saved = 'saved' in input ? Number(input.saved) : existing?.saved || 0;
    const completed =
      'completed' in input ? Number(input.completed) : existing?.completed || 0;
    const lastPage = Number(input.lastPage ?? existing?.lastPage ?? 1);
    await db()
      .prepare(
        'INSERT INTO reading (userId,noteId,saved,completed,lastPage) VALUES (?,?,?,?,?) ON CONFLICT(userId,noteId) DO UPDATE SET saved=excluded.saved,completed=excluded.completed,lastPage=excluded.lastPage',
      )
      .bind(user.userId, id, saved, completed, lastPage)
      .run();
    return json({ noteId: id, saved, completed, lastPage });
  } catch (e) {
    return errorResponse(e);
  }
}
