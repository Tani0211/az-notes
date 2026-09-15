import { get } from '@vercel/blob';
import {
  ApiError,
  apiUser,
  errorResponse,
  findShortNote,
} from '../../../../../lib/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    const note = await findShortNote(id, user.admin);
    if (!note?.imageKey) throw new ApiError('Image not found.', 404);
    const object = await get(note.imageKey, { access: 'private' });
    if (!object) throw new ApiError('Image not found.', 404);
    return new Response(object.stream, {
      headers: {
        'Content-Type': object.blob.contentType || 'application/octet-stream',
        'Content-Length': String(object.blob.size),
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
