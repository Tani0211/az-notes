import {
  ApiError,
  apiUser,
  db,
  errorResponse,
  json,
  validateFlashcard,
  validateFlashcardSet,
} from '../../../lib/server';
import type { FlashcardSet } from '../../../lib/types';

export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    if (Number(req.headers.get('content-length')) > 6_000_000)
      throw new ApiError('The flashcard import is too large.');
    const body = (await req.json()) as { metadata?: unknown; cards?: unknown };
    const metadata = validateFlashcardSet(body.metadata);
    if (!Array.isArray(body.cards) || !body.cards.length)
      throw new ApiError('The CSV does not contain any flashcards.');
    if (body.cards.length > 1000)
      throw new ApiError('A CSV can contain at most 1,000 flashcards.');
    const cards = body.cards.map(validateFlashcard);
    const id = crypto.randomUUID();
    const now = Date.now();
    const statements = [
      db()
        .prepare(
          'INSERT INTO flashcard_sets (id,name,topic,phase,tag,source,status,fileName,cardCount,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          id,
          metadata.name,
          metadata.topic,
          metadata.phase,
          metadata.tag,
          metadata.source,
          metadata.status,
          metadata.fileName,
          cards.length,
          now,
          now,
        ),
      ...cards.map((card, position) =>
        db()
          .prepare(
            'INSERT INTO flashcards (id,setId,question,answer,position,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)',
          )
          .bind(
            crypto.randomUUID(),
            id,
            card.question,
            card.answer,
            position,
            now,
            now,
          ),
      ),
    ];
    await db().batch(statements);
    const created = await db()
      .prepare('SELECT * FROM flashcard_sets WHERE id=?')
      .bind(id)
      .first<Omit<FlashcardSet, 'cards'>>();
    const { results: createdCards } = await db()
      .prepare('SELECT * FROM flashcards WHERE setId=? ORDER BY position')
      .bind(id)
      .all<FlashcardSet['cards'][number]>();
    return json({ ...created!, cards: createdCards }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
