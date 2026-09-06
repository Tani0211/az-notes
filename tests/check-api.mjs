import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = 'http://localhost:3000';
const mode = process.argv[2] || 'student';
const signed = await fetch(base + '/signin-with-chatgpt?return_to=/library', {
  redirect: 'manual',
});
assert.equal(signed.status, 302);
const cookie = signed.headers.get('set-cookie').split(';')[0];
const headers = {
  cookie,
  origin: base,
  'x-b15-action': '1',
  'content-type': 'application/json',
};
async function call(path, init = {}, expected = 200) {
  const r = await fetch(base + path, { headers, ...init, redirect: 'manual' });
  assert.equal(r.status, expected, `${path}: unexpected HTTP ${r.status}`);
  return r;
}
if (mode === 'student') {
  for (const path of [
    '/api/notes',
    '/api/notes/b15-01/file',
    '/api/notes/b15-01/open',
  ]) {
    const r = await fetch(base + path, { redirect: 'manual' });
    assert.equal(r.status, 401, path + ' must require login');
  }
  const spoof = await fetch(base + '/api/notes', {
    headers: {
      'oai-authenticated-user-id': 'fake',
      'oai-authenticated-user-email': 'singhalrashmi0211@gmail.com',
    },
  });
  assert.equal(
    spoof.status,
    401,
    'Client-supplied identity headers must not grant access',
  );
  const notes = await (await call('/api/notes')).json();
  assert.equal(notes.length, 20);
  assert.ok(
    notes.every((note) => !note.codeUrl),
    'Imported third-party code links must be absent',
  );
  assert.ok(
    notes.every((note) => !('handwrittenUrl' in note)),
    'Handwritten notes must be absent',
  );
  assert.equal(notes.find((n) => n.id === 'b15-01').phase, 0);
  assert.equal(notes.find((n) => n.id === 'b15-12').phase, 1);
  assert.equal(notes.find((n) => n.id === 'b15-20').phase, 2);
  await call('/api/notes', { method: 'POST', body: '{}' }, 403);
  await call('/api/upload', { method: 'POST', body: '{}' }, 403);
  await call(
    '/api/admins',
    {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', action: 'add' }),
    },
    403,
  );
  await call(
    '/api/notes/b15-01/state',
    {
      method: 'POST',
      headers: { ...headers, origin: 'https://untrusted.invalid' },
      body: '{"saved":true}',
    },
    403,
  );
  let state = await (
    await call('/api/notes/b15-01/state', {
      method: 'POST',
      body: '{"saved":true,"completed":true,"lastPage":2}',
    })
  ).json();
  assert.equal(state.saved, 1);
  assert.equal(state.lastPage, 2);
  await call(
    '/api/notes/b15-01/state',
    { method: 'POST', body: '{"lastPage":0}' },
    400,
  );
  state = await (
    await call('/api/notes/b15-01/state', {
      method: 'POST',
      body: '{"saved":false,"completed":false,"lastPage":1}',
    })
  ).json();
  assert.equal(state.saved, 0);
  const online = await (await call('/api/presence', { method: 'POST' })).json();
  assert(online.online >= 1);
  await call('/library');
  await call('/notes/b15-01');
  console.log(
    'PASS: authentication, identity spoof protection, student permissions, CSRF, 20 imported notes, phase mapping, reading state, and presence.',
  );
} else if (mode === 'admin') {
  const pdf = await readFile(
    '../az-notes-master/public/stack-usage-mastery.pdf',
  );
  const form = new FormData();
  form.append(
    'file',
    new Blob([pdf], { type: 'application/pdf' }),
    'test-notes.pdf',
  );
  const upload = await (
    await call(
      '/api/upload',
      {
        method: 'POST',
        headers: { cookie, origin: base, 'x-b15-action': '1' },
        body: form,
      },
      201,
    )
  ).json();
  assert(upload.key.startsWith('notes/'));
  const invalidForm = new FormData();
  invalidForm.append('file', new Blob(['not a PDF']), 'fake.pdf');
  await call(
    '/api/upload',
    {
      method: 'POST',
      headers: { cookie, origin: base, 'x-b15-action': '1' },
      body: invalidForm,
    },
    400,
  );
  const draft = {
    title: 'QA temporary lecture',
    topic: 'QA',
    date: '2026-08-23',
    week: 11,
    phase: 2,
    summary: 'Local integration test only',
    fileKey: upload.key,
    driveUrl: '',
    codeUrl: '',
    status: 'draft',
  };
  const note = await (
    await call(
      '/api/notes',
      { method: 'POST', body: JSON.stringify(draft) },
      201,
    )
  ).json();
  assert(note.id);
  const file = await call('/api/notes/' + note.id + '/file');
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  const actual = Buffer.from(await file.arrayBuffer());
  assert(actual.equals(pdf), 'Stored PDF bytes must round-trip');
  const range = await call(
    '/api/notes/' + note.id + '/file',
    { headers: { ...headers, range: 'bytes=0-4' } },
    206,
  );
  assert.equal(await range.text(), '%PDF-');
  await call('/api/notes/' + note.id, {
    method: 'PUT',
    body: JSON.stringify({ ...draft, status: 'published' }),
  });
  await call(
    '/api/notes/' + note.id,
    {
      method: 'PUT',
      body: JSON.stringify({
        ...draft,
        status: 'published',
        driveUrl: 'http://localhost/secret',
      }),
    },
    400,
  );
  await call('/api/notes/' + note.id, {
    method: 'PUT',
    body: JSON.stringify(draft),
  });
  await call(
    '/api/admins',
    {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', action: 'add' }),
    },
    403,
  );
  await call('/admin');
  console.log(
    'PASS: PDF upload and byte/range retrieval, invalid-file rejection, drafts, publishing, updates, URL validation, and owner-only admin management.',
  );
  console.log('Temporary local note:', note.id);
}
