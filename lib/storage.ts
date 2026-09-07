import 'server-only';
import { del, get, head } from '@vercel/blob';
import { ApiError } from './server';

export const MAX_PDF_BYTES = 30 * 1024 * 1024;
export const pdfPath = (value: string) =>
  /^notes\/[a-f0-9-]{36}\.pdf$/.test(value);

export async function verifyStoredPdf(pathname: string) {
  if (!pdfPath(pathname)) throw new ApiError('Invalid uploaded file.');
  let metadata;
  try {
    metadata = await head(pathname);
  } catch {
    throw new ApiError('The uploaded PDF is missing.');
  }
  if (
    metadata.size < 5 ||
    metadata.size > MAX_PDF_BYTES ||
    metadata.contentType !== 'application/pdf'
  ) {
    await del(pathname).catch(() => undefined);
    throw new ApiError('Choose a valid PDF no larger than 30 MB.');
  }
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200)
    throw new ApiError('The uploaded PDF is missing.');
  const reader = result.stream.getReader();
  const first = await reader.read();
  await reader.cancel();
  const magic = new TextDecoder().decode(first.value?.slice(0, 5));
  if (magic !== '%PDF-') {
    await del(pathname).catch(() => undefined);
    throw new ApiError('This file is not a valid PDF.');
  }
  return metadata;
}
