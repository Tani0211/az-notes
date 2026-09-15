import { del } from '@vercel/blob';
import {
  ApiError,
  apiUser,
  db,
  errorResponse,
  json,
  validateShortNote,
} from '../../../../lib/server';
import { verifyStoredImage } from '../../../../lib/storage';
import type { ShortNote } from '../../../../lib/types';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiUser(req, true);
    const { id } = await params;
    const existing = await db()
      .prepare('SELECT * FROM short_notes WHERE id=?')
      .bind(id)
      .first<ShortNote>();
    if (!existing) throw new ApiError('Short note not found.', 404);
    const note = validateShortNote(await req.json());
    if (note.imageKey && note.imageKey !== existing.imageKey)
      await verifyStoredImage(note.imageKey);
    await db()
      .prepare(
        'UPDATE short_notes SET title=?,topic=?,phase=?,tag=?,source=?,body=?,code=?,language=?,imageKey=?,status=?,updatedAt=? WHERE id=?',
      )
      .bind(
        note.title,
        note.topic,
        note.phase,
        note.tag,
        note.source,
        note.body,
        note.code,
        note.language,
        note.imageKey,
        note.status,
        Date.now(),
        id,
      )
      .run();
    if (existing.imageKey && existing.imageKey !== note.imageKey)
      await del(existing.imageKey).catch(() => undefined);
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
      .prepare('SELECT * FROM short_notes WHERE id=?')
      .bind(id)
      .first<ShortNote>();
    if (!existing) throw new ApiError('Short note not found.', 404);
    await db().prepare('DELETE FROM short_notes WHERE id=?').bind(id).run();
    if (existing.imageKey) await del(existing.imageKey).catch(() => undefined);
    return json({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
