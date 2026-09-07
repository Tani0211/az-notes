import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { apiUser, json, errorResponse, ApiError } from '../../../lib/server';
import { MAX_PDF_BYTES, pdfPath } from '../../../lib/storage';
export async function POST(req: Request) {
  try {
    await apiUser(req, true);
    const body = (await req.json()) as HandleUploadBody;
    const result = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pdfPath(pathname)) throw new ApiError('Invalid upload path.');
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: MAX_PDF_BYTES,
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
