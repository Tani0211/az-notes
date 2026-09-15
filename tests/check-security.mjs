import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [
  auth,
  server,
  upload,
  file,
  shortImage,
  flashcardImport,
  shortNoteWrite,
] = await Promise.all([
  readFile('lib/google-auth.ts', 'utf8'),
  readFile('lib/server.ts', 'utf8'),
  readFile('app/api/upload/route.ts', 'utf8'),
  readFile('app/api/notes/[id]/file/route.ts', 'utf8'),
  readFile('app/api/short-notes/[id]/image/route.ts', 'utf8'),
  readFile('app/api/flashcard-sets/route.ts', 'utf8'),
  readFile('app/api/short-notes/route.ts', 'utf8'),
]);
assert.doesNotMatch(
  auth + server,
  /oai-authenticated-user|chatgpt-auth|cloudflare:workers/,
);
assert.match(upload, /\? \['application\/pdf'\]/);
assert.match(upload, /\['image\/png', 'image\/jpeg', 'image\/webp'\]/);
assert.match(upload, /pdf \? MAX_PDF_BYTES : MAX_IMAGE_BYTES/);
assert.match(file, /access:\s*'private'/);
assert.match(shortImage, /await apiUser\(\)/);
assert.match(shortImage, /access:\s*'private'/);
assert.match(flashcardImport, /await apiUser\(req, true\)/);
assert.match(shortNoteWrite, /await apiUser\(req, true\)/);
console.log(
  'PASS: verified Google-only identity, admin-only content writes and private file storage.',
);
