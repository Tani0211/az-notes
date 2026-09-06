import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile('lib/calendar.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { phaseForDate, validateCalendar } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);
const calendar = JSON.parse(
  await readFile('content/phase-calendar.json', 'utf8'),
);
assert.equal(validateCalendar(calendar).length, 6);
assert.deepEqual(phaseForDate('2026-05-31', calendar), { phase: 0, week: 1 });
assert.deepEqual(phaseForDate('2026-06-27', calendar), { phase: 0, week: 4 });
assert.equal(phaseForDate('2026-06-28', calendar), null);
assert.deepEqual(phaseForDate('2026-07-05', calendar), { phase: 1, week: 5 });
assert.equal(phaseForDate('2026-08-02', calendar), null);
assert.deepEqual(phaseForDate('2026-08-09', calendar), { phase: 2, week: 9 });
assert.deepEqual(phaseForDate('2026-09-05', calendar), { phase: 2, week: 12 });
assert.equal(phaseForDate('2026-09-06', calendar), null);
assert.throws(() =>
  validateCalendar([
    ...calendar.slice(0, 1),
    { phase: 1, start: '2026-06-20', end: '2026-06-30' },
    ...calendar.slice(2),
  ]),
);
assert.throws(() =>
  validateCalendar([
    { phase: 0, start: '2026-02-30', end: '2026-03-05' },
    ...calendar.slice(1),
  ]),
);
console.log(
  'PASS: phase boundaries, gap weeks, course week numbering, unset future phases, invalid dates and overlaps.',
);
