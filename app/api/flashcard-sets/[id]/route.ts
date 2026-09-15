import {
  ApiError,
  apiUser,
  db,
  errorResponse,
  json,
  validateFlashcardSet,
} from '../../../../lib/server';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiUser(req, true);
    const { id } = await params;
    const existing = await db()
      .prepare('SELECT id,fileName FROM flashcard_sets WHERE id=?')
      .bind(id)
      .first<{ id: string; fileName: string }>();
    if (!existing) throw new ApiError('Flashcard deck not found.', 404);
    const value = validateFlashcardSet(await req.json());
    await db()
      .prepare(
        'UPDATE flashcard_sets SET name=?,topic=?,phase=?,tag=?,source=?,status=?,fileName=?,updatedAt=? WHERE id=?',
      )
      .bind(
        value.name,
        value.topic,
        value.phase,
        value.tag,
        value.source,
        value.status,
        existing.fileName,
        Date.now(),
        id,
      )
      .run();
    return json({ id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiUser(req, true);
    const { id } = await params;
    const existing = await db()
      .prepare('SELECT id FROM flashcard_sets WHERE id=?')
      .bind(id)
      .first();
    if (!existing) throw new ApiError('Flashcard deck not found.', 404);
    await db().prepare('DELETE FROM flashcard_sets WHERE id=?').bind(id).run();
    return json({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
