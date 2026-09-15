import {
  apiUser,
  db,
  errorResponse,
  json,
  validateShortNote,
} from '../../../lib/server';
import { verifyStoredImage } from '../../../lib/storage';
import type { ShortNote } from '../../../lib/types';

export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    const note = validateShortNote(await req.json());
    if (note.imageKey) await verifyStoredImage(note.imageKey);
    const id = crypto.randomUUID();
    const now = Date.now();
    await db()
      .prepare(
        'INSERT INTO short_notes (id,title,topic,phase,tag,source,body,code,language,imageKey,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
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
        now,
        now,
      )
      .run();
    const created = await db()
      .prepare('SELECT * FROM short_notes WHERE id=?')
      .bind(id)
      .first<ShortNote>();
    return json(created, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
