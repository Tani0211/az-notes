const indiaDate = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function indiaDateKey(value: number | Date = Date.now()) {
  const parts = new Map(
    indiaDate
      .formatToParts(value)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${parts.get('year')}-${parts.get('month')}-${parts.get('day')}`;
}
