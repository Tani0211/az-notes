import {
  ApiError,
  apiUser,
  db,
  errorResponse,
  json,
  validateFlashcard,
} from '../../../lib/server';
import type { Flashcard } from '../../../lib/types';

export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    const body = (await req.json()) as Record<string, unknown>;
    const setId = typeof body.setId === 'string' ? body.setId : '';
    const set = await db()
      .prepare('SELECT id FROM flashcard_sets WHERE id=?')
      .bind(setId)
      .first<{ id: string }>();
    if (!set) throw new ApiError('Flashcard deck not found.', 404);
    const last = await db()
      .prepare(
        'SELECT COALESCE(MAX(position),-1) AS position FROM flashcards WHERE setId=?',
      )
      .bind(setId)
      .first<{ position: number }>();
    const card = validateFlashcard(body);
    const id = crypto.randomUUID();
    const now = Date.now();
    await db().batch([
      db()
        .prepare(
          'INSERT INTO flashcards (id,setId,question,answer,position,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
        )
        .bind(
          id,
          setId,
          card.question,
          card.answer,
          (last?.position ?? -1) + 1,
          now,
          now,
        ),
      db()
        .prepare(
          'UPDATE flashcard_sets SET cardCount=cardCount+1,updatedAt=? WHERE id=?',
        )
        .bind(now, setId),
    ]);
    const created = await db()
      .prepare('SELECT * FROM flashcards WHERE id=?')
      .bind(id)
      .first<Flashcard>();
    return json(created, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
