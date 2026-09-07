import { get } from '@vercel/blob';
import {
  apiUser,
  findNote,
  driveId,
  errorResponse,
  ApiError,
  db,
} from '../../../../../lib/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await params;
    const note = await findNote(id, user.admin);
    if (!note) throw new ApiError('Lecture not found.', 404);
    const url = new URL(req.url);
    const download = url.searchParams.get('download') === '1';
    const name =
      (note.title.replace(/[^a-zA-Z0-9 -]/g, '').slice(0, 100) ||
        'lecture-notes') + '.pdf';
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition':
        (download ? 'attachment' : 'inline') + '; filename="' + name + '"',
    });
    let body: ReadableStream<Uint8Array> | null = null;
    let status = 200;

    if (note.fileKey) {
      const object = await get(note.fileKey, {
        access: 'private',
        ifNoneMatch: download
          ? undefined
          : req.headers.get('if-none-match') || undefined,
      });
      if (!object) throw new ApiError('The PDF could not be found.', 404);
      headers.set('ETag', object.blob.etag);
      if (object.statusCode === 304)
        return new Response(null, { status: 304, headers });
      body = object.stream;
      headers.set('Content-Length', String(object.blob.size));
    } else {
      const drive = driveId(note.driveUrl);
      if (!drive) throw new ApiError('No PDF is attached yet.', 404);
      const upstream = await fetch(
        'https://drive.usercontent.google.com/download?id=' +
          encodeURIComponent(drive) +
          '&export=download&confirm=t',
        {
          headers: req.headers.has('range')
            ? { Range: req.headers.get('range')! }
            : {},
          signal: AbortSignal.timeout(25000),
        },
      );
      if (
        !upstream.ok ||
        !/(application\/pdf|application\/octet-stream)/i.test(
          upstream.headers.get('content-type') || '',
        )
      )
        throw new ApiError(
          'Google Drive could not serve this PDF. Use Open in Drive, or ask the admin to upload a copy.',
          502,
        );
      body = upstream.body;
      status = upstream.status;
      for (const key of ['content-length', 'content-range', 'accept-ranges'])
        if (upstream.headers.has(key))
          headers.set(key, upstream.headers.get(key)!);
    }

    if (download && !req.headers.has('range'))
      await db()
        .prepare(
          'INSERT OR IGNORE INTO events (userId,noteId,kind,bucket,createdAt) VALUES (?,?,?,?,?)',
        )
        .bind(
          user.userId,
          id,
          'download',
          Math.floor(Date.now() / 300000),
          Date.now(),
        )
        .run();
    return new Response(body, { status, headers });
  } catch (e) {
    return errorResponse(e);
  }
}
