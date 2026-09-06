import {
  apiUser,
  findNote,
  driveId,
  files,
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
    let body: ReadableStream | null = null;
    let status = 200;
    if (note.fileKey) {
      const object = await files().get(note.fileKey, { range: req.headers });
      if (!object) throw new ApiError('The PDF could not be found.', 404);
      body = object.body;
      headers.set('Accept-Ranges', 'bytes');
      headers.set('ETag', object.httpEtag);
      const range = object.range as
        | { offset?: number; length?: number; suffix?: number }
        | undefined;
      if (range && req.headers.has('range')) {
        const offset =
          range.offset ??
          Math.max(0, object.size - (range.suffix ?? object.size));
        const length =
          range.length ?? Math.min(range.suffix ?? object.size, object.size);
        headers.set(
          'Content-Range',
          `bytes ${offset}-${offset + length - 1}/${object.size}`,
        );
        headers.set('Content-Length', String(length));
        status = 206;
      } else headers.set('Content-Length', String(object.size));
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
      for (const k of ['content-length', 'content-range', 'accept-ranges'])
        if (upstream.headers.has(k)) headers.set(k, upstream.headers.get(k)!);
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
