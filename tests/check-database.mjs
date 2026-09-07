import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

let source = await readFile('lib/database.ts', 'utf8');
source = source
  .replace("import postgres from 'postgres';", '')
  .slice(0, source.indexOf('let connection'));
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { compileQuery, parseSafeInteger } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

const select = compileQuery(
  "SELECT '?' AS literal, userId FROM reading WHERE noteId=? -- ? stays\n",
);
assert.equal(select.parameters, 1);
assert.match(select.text, /"userId"/);
assert.match(select.text, /"noteId"=\$1/);
assert.match(select.text, /'\?'/);
assert.match(select.text, /-- \? stays/);

const insert = compileQuery(
  'INSERT OR IGNORE INTO events (userId,noteId,kind,bucket,createdAt) VALUES (?,?,?,?,?)',
);
assert.equal(insert.parameters, 5);
assert.match(insert.text, /^INSERT INTO/i);
assert.match(insert.text, /ON CONFLICT DO NOTHING$/);
assert.throws(() => compileQuery('SELECT $1'));
assert.equal(parseSafeInteger('9007199254740991'), Number.MAX_SAFE_INTEGER);
assert.throws(() => parseSafeInteger('9007199254740992'));

console.log(
  'PASS: PostgreSQL query compilation, identifier quoting and safe integer parsing.',
);
