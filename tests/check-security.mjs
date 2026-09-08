import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [auth, server, upload, file] = await Promise.all([
  readFile('lib/google-auth.ts', 'utf8'),
  readFile('lib/server.ts', 'utf8'),
  readFile('app/api/upload/route.ts', 'utf8'),
  readFile('app/api/notes/[id]/file/route.ts', 'utf8'),
]);
assert.doesNotMatch(
  auth + server,
  /oai-authenticated-user|chatgpt-auth|cloudflare:workers/,
);
assert.match(upload, /allowedContentTypes:\s*\['application\/pdf'\]/);
assert.match(upload, /maximumSizeInBytes:\s*MAX_PDF_BYTES/);
assert.match(file, /access:\s*'private'/);
console.log('PASS: verified Google-only identity and private PDF storage.');
