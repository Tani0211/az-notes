import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile('lib/math.ts', 'utf8');
const compiled = ts.transpile(source, {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
});
const { parseMathText } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

assert.deepEqual(parseMathText('Machine $i$ makes $X / a_i$ products.'), [
  { kind: 'text', value: 'Machine ' },
  { kind: 'math', value: 'i', display: false },
  { kind: 'text', value: ' makes ' },
  { kind: 'math', value: 'X / a_i', display: false },
  { kind: 'text', value: ' products.' },
]);

assert.deepEqual(parseMathText('Use $$O(n \\log n)$$ overall.'), [
  { kind: 'text', value: 'Use ' },
  { kind: 'math', value: 'O(n \\log n)', display: true },
  { kind: 'text', value: ' overall.' },
]);

assert.deepEqual(parseMathText('Both \\(lo + hi\\) and \\[lo, hi\\].'), [
  { kind: 'text', value: 'Both ' },
  { kind: 'math', value: 'lo + hi', display: false },
  { kind: 'text', value: ' and ' },
  { kind: 'math', value: 'lo, hi', display: true },
  { kind: 'text', value: '.' },
]);

assert.deepEqual(parseMathText('An unmatched $ stays ordinary.'), [
  { kind: 'text', value: 'An unmatched $ stays ordinary.' },
]);

assert.deepEqual(parseMathText('A literal \\$5 stays ordinary.'), [
  { kind: 'text', value: 'A literal \\$5 stays ordinary.' },
]);

console.log('Math text checks passed.');
