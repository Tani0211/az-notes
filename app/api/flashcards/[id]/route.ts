import {
  ApiError,
  apiUser,
  db,
  errorResponse,
  json,
  validateFlashcard,
} from '../../../../lib/server';
import type { Flashcard } from '../../../../lib/types';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await apiUser(req, true);
    const { id } = await params;
    const existing = await db()
      .prepare('SELECT id FROM flashcards WHERE id=?')
      .bind(id)
      .first();
    if (!existing) throw new ApiError('Flashcard not found.', 404);
    const card = validateFlashcard(await req.json());
    await db()
      .prepare(
        'UPDATE flashcards SET question=?,answer=?,updatedAt=? WHERE id=?',
      )
      .bind(card.question, card.answer, Date.now(), id)
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
    const card = await db()
      .prepare('SELECT * FROM flashcards WHERE id=?')
      .bind(id)
      .first<Flashcard>();
    if (!card) throw new ApiError('Flashcard not found.', 404);
    await db().batch([
      db().prepare('DELETE FROM flashcards WHERE id=?').bind(id),
      db()
        .prepare(
          'UPDATE flashcard_sets SET cardCount=GREATEST(cardCount-1,0),updatedAt=? WHERE id=?',
        )
        .bind(Date.now(), card.setId),
    ]);
    return json({ id });
  } catch (error) {
    return errorResponse(error);
  }
}
