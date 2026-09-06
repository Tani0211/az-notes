import {
  apiUser,
  findNote,
  driveId,
  ApiError,
  errorResponse,
} from '../../../../../lib/server';
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    const note = await findNote(id, user.admin);
    if (!note) throw new ApiError('Lecture not found.', 404);
    const idDrive = driveId(note.driveUrl);
    if (!idDrive) throw new ApiError('No Drive link for this note.', 404);
    return new Response(null, {
      status: 302,
      headers: {
        Location: 'https://drive.google.com/file/d/' + idDrive + '/view',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
