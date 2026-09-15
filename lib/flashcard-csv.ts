export type CsvFlashcard = { question: string; answer: string };

const MAX_CARDS = 1000;

function rowsFromCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') {
      if (cell)
        throw Error('A quote must start at the beginning of a CSV cell.');
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') cell += char;
  }
  if (quoted) throw Error('The CSV contains an unclosed quoted value.');
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value.trim()));
}

export function parseFlashcardCsv(source: string): CsvFlashcard[] {
  if (!source.trim()) throw Error('The CSV file is empty.');
  const rows = rowsFromCsv(source.replace(/^\uFEFF/, ''));
  const headers = rows.shift()?.map((value) => value.trim().toLowerCase());
  if (
    !headers ||
    headers.length !== 2 ||
    headers[0] !== 'question' ||
    headers[1] !== 'answer'
  )
    throw Error('The CSV header must be exactly: question,answer');
  if (!rows.length) throw Error('The CSV does not contain any flashcards.');
  if (rows.length > MAX_CARDS)
    throw Error(`A CSV can contain at most ${MAX_CARDS} flashcards.`);

  return rows.map((values, index) => {
    if (values.length !== 2)
      throw Error(`Row ${index + 2} must contain exactly two columns.`);
    const question = values[0].trim();
    const answer = values[1].trim();
    if (!question || !answer)
      throw Error(`Row ${index + 2} needs both a question and an answer.`);
    if (question.length > 500)
      throw Error(
        `The question in row ${index + 2} is longer than 500 characters.`,
      );
    if (answer.length > 5000)
      throw Error(
        `The answer in row ${index + 2} is longer than 5,000 characters.`,
      );
    return { question, answer };
  });
}
