import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile('lib/flashcard-csv.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { parseFlashcardCsv } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

assert.deepEqual(parseFlashcardCsv('question,answer\nQ1,A1\nQ2,A2\n'), [
  { question: 'Q1', answer: 'A1' },
  { question: 'Q2', answer: 'A2' },
]);
assert.deepEqual(
  parseFlashcardCsv(
    '\uFEFFQuestion,Answer\r\n"Why use it?","Handles commas, and ""quotes""."\r\n"Steps?","One\nTwo"',
  ),
  [
    {
      question: 'Why use it?',
      answer: 'Handles commas, and "quotes".',
    },
    { question: 'Steps?', answer: 'One\nTwo' },
  ],
);
assert.throws(() => parseFlashcardCsv('term,definition\nQ,A'));
assert.throws(() => parseFlashcardCsv('question,answer\nQ,'));
assert.throws(() => parseFlashcardCsv('question,answer,topic\nQ,A,T'));
assert.throws(() =>
  parseFlashcardCsv(
    'question,answer\n' +
      Array.from({ length: 1001 }, (_, index) => `Q${index},A${index}`).join(
        '\n',
      ),
  ),
);

const migration = await readFile(
  'db/migrations/002_revision_content.sql',
  'utf8',
);
assert.match(migration, /REFERENCES flashcard_sets\(id\) ON DELETE CASCADE/);
assert.doesNotMatch(migration, /UNIQUE\s*\(question\)/i);
assert.match(migration, /CREATE TABLE short_notes/);
assert.match(migration, /"imageKey" text NOT NULL/);

console.log(
  'PASS: CSV quoting, exact headers, independent deck schema and short-note storage.',
);
