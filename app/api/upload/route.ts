import {
  apiUser,
  files,
  json,
  errorResponse,
  ApiError,
} from '../../../lib/server';
const MAX = 30 * 1024 * 1024;
export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    if (Number(req.headers.get('content-length')) > MAX + 50000)
      throw new ApiError('PDFs must be 30 MB or smaller.', 413);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0 || file.size > MAX)
      throw new ApiError('Choose a PDF up to 30 MB.', 413);
    const magic = new TextDecoder().decode(
      await file.slice(0, 5).arrayBuffer(),
    );
    if (magic !== '%PDF-') throw new ApiError('This file is not a valid PDF.');
    const key = 'notes/' + crypto.randomUUID() + '.pdf';
    await files().put(key, file.stream(), {
      httpMetadata: { contentType: 'application/pdf' },
    });
    return json({ key, name: file.name, size: file.size }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
