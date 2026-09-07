import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [auth, server, upload, file, seed] = await Promise.all([
  readFile('lib/google-auth.ts', 'utf8'),
  readFile('lib/server.ts', 'utf8'),
  readFile('app/api/upload/route.ts', 'utf8'),
  readFile('app/api/notes/[id]/file/route.ts', 'utf8'),
  readFile('content/seed.json', 'utf8').then(JSON.parse),
]);
assert.doesNotMatch(
  auth + server,
  /oai-authenticated-user|chatgpt-auth|cloudflare:workers/,
);
assert.match(upload, /allowedContentTypes:\s*\['application\/pdf'\]/);
assert.match(upload, /maximumSizeInBytes:\s*MAX_PDF_BYTES/);
assert.match(file, /access:\s*'private'/);
assert.ok(seed.every((note) => !note.codeUrl));
assert.ok(seed.every((note) => !('handwrittenUrl' in note)));
console.log(
  'PASS: verified Google-only identity, private PDF storage and clean digital-note seed.',
);
