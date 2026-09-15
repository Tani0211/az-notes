import {
  ApiError,
  apiUser,
  errorResponse,
  recordFlashcardNext,
  json,
  randomPublishedFlashcard,
  sameOrigin,
} from '../../../../lib/server';

export async function GET() {
  try {
    await apiUser();
    const card = await randomPublishedFlashcard();
    if (!card) throw new ApiError('No published flashcards yet.', 404);
    return json(card);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await apiUser(req);
    if (!sameOrigin(req))
      throw new ApiError('This request could not be verified.', 403);
    const card = await randomPublishedFlashcard();
    if (!card) throw new ApiError('No published flashcards yet.', 404);
    const todayClicks = await recordFlashcardNext();
    return json({ ...card, todayClicks });
  } catch (error) {
    return errorResponse(error);
  }
}
