import {
  ApiError,
  apiUser,
  errorResponse,
  json,
  randomPublishedFlashcard,
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
