import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile('lib/date.ts', 'utf8');
const compiled = ts.transpile(source, {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
});
const { indiaDateKey } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

assert.equal(indiaDateKey(new Date('2026-09-15T18:29:59Z')), '2026-09-15');
assert.equal(indiaDateKey(new Date('2026-09-15T18:30:00Z')), '2026-09-16');
console.log('India date-key checks passed.');
