import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { apiUser, json, errorResponse, ApiError } from '../../../lib/server';
import {
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  imagePath,
  pdfPath,
} from '../../../lib/storage';
export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    const body = (await req.json()) as HandleUploadBody;
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const pdf = pdfPath(pathname);
        const image = imagePath(pathname);
        if (!pdf && !image) throw new ApiError('Invalid upload path.');
        return {
          allowedContentTypes: pdf
            ? ['application/pdf']
            : ['image/png', 'image/jpeg', 'image/webp'],
          maximumSizeInBytes: pdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
