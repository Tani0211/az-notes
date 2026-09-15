import 'server-only';
import { del, get, head } from '@vercel/blob';
import { ApiError } from './server';

export const MAX_PDF_BYTES = 30 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const pdfPath = (value: string) =>
  /^notes\/[a-f0-9-]{36}\.pdf$/.test(value);
export const imagePath = (value: string) =>
  /^short-notes\/[a-f0-9-]{36}\.(png|jpe?g|webp)$/.test(value);

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

export async function verifyStoredImage(pathname: string) {
  if (!imagePath(pathname)) throw new ApiError('Invalid short-note image.');
  let metadata;
  try {
    metadata = await head(pathname);
  } catch {
    throw new ApiError('The uploaded image is missing.');
  }
  const accepted = ['image/png', 'image/jpeg', 'image/webp'];
  if (
    metadata.size < 12 ||
    metadata.size > MAX_IMAGE_BYTES ||
    !accepted.includes(metadata.contentType)
  ) {
    await del(pathname).catch(() => undefined);
    throw new ApiError(
      'Choose a PNG, JPEG, or WebP image no larger than 10 MB.',
    );
  }
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200)
    throw new ApiError('The uploaded image is missing.');
  const reader = result.stream.getReader();
  const first = await reader.read();
  await reader.cancel();
  const bytes = first.value || new Uint8Array();
  const png =
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    );
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp =
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  const matchesType =
    (metadata.contentType === 'image/png' && png) ||
    (metadata.contentType === 'image/jpeg' && jpeg) ||
    (metadata.contentType === 'image/webp' && webp);
  if (!matchesType) {
    await del(pathname).catch(() => undefined);
    throw new ApiError('The uploaded file is not a valid image.');
  }
  return metadata;
}
