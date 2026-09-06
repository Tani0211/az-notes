export type PhasePeriod = { phase: number; start: string; end: string };
export const blankCalendar: PhasePeriod[] = [0, 1, 2, 3, 4, 5].map((phase) => ({
  phase,
  start: '',
  end: '',
}));
export function phaseForDate(date: string, calendar: PhasePeriod[]) {
  if (!date) return null;
  const period = calendar.find(
    (p) => p.start && p.end && date >= p.start && date <= p.end,
  );
  if (!period) return null;
  return {
    phase: period.phase,
    week:
      period.phase * 4 +
      1 +
      Math.floor(
        (Date.parse(date + 'T00:00:00Z') -
          Date.parse(period.start + 'T00:00:00Z')) /
          604800000,
      ),
  };
}
export function validateCalendar(input: unknown): PhasePeriod[] {
  if (!Array.isArray(input) || input.length !== 6)
    throw Error('Provide the six phase periods.');
  const periods: PhasePeriod[] = input.map((p: unknown, i) => {
    if (!p || typeof p !== 'object') throw Error('Invalid phase period.');
    const row = p as PhasePeriod;
    if (
      row.phase !== i ||
      typeof row.start !== 'string' ||
      typeof row.end !== 'string'
    )
      throw Error('Invalid phase period.');
    if (!row.start && !row.end) return { phase: i, start: '', end: '' };
    for (const date of [row.start, row.end])
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        throw Error('Enter valid start and end dates.');
    if (row.start > row.end)
      throw Error('A phase must end on or after its start date.');
    const days = (Date.parse(row.end) - Date.parse(row.start)) / 86400000;
    if (days > 27) throw Error('A phase can span at most four course weeks.');
    return { phase: i, start: row.start, end: row.end };
  });
  const scheduled = periods.filter((p) => p.start);
  for (let i = 1; i < scheduled.length; i++)
    if (scheduled[i].start <= scheduled[i - 1].end)
      throw Error(
        'Phase dates must be chronological and must not overlap. Leave gap weeks between periods when needed.',
      );
  return periods;
}
