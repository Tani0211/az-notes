import {
  apiUser,
  validateNote,
  db,
  files,
  json,
  errorResponse,
  ApiError,
  findNote,
} from '../../../../lib/server';
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
    if (n.fileKey && !(await files().head(n.fileKey)))
      throw new ApiError('The uploaded PDF is missing.');
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
