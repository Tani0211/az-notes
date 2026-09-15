export type MathTextPart =
  | { kind: 'text'; value: string }
  | { kind: 'math'; value: string; display: boolean };

function isEscaped(source: string, index: number) {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === '\\'; cursor--)
    slashes++;
  return slashes % 2 === 1;
}

function closingIndex(source: string, delimiter: string, from: number) {
  let cursor = source.indexOf(delimiter, from);
  while (cursor >= 0 && isEscaped(source, cursor))
    cursor = source.indexOf(delimiter, cursor + delimiter.length);
  return cursor;
}

export function parseMathText(source: string): MathTextPart[] {
  const parts: MathTextPart[] = [];
  let textStart = 0;
  let cursor = 0;

  while (cursor < source.length) {
    if (isEscaped(source, cursor)) {
      cursor++;
      continue;
    }

    let opening = '';
    let closing = '';
    let display = false;

    if (source.startsWith('$$', cursor)) {
      opening = '$$';
      closing = '$$';
      display = true;
    } else if (source.startsWith('\\[', cursor)) {
      opening = '\\[';
      closing = '\\]';
      display = true;
    } else if (source.startsWith('\\(', cursor)) {
      opening = '\\(';
      closing = '\\)';
    } else if (source[cursor] === '$') {
      opening = '$';
      closing = '$';
    }

    if (!opening) {
      cursor++;
      continue;
    }

    const expressionStart = cursor + opening.length;
    const end = closingIndex(source, closing, expressionStart);
    const expression =
      end >= 0 ? source.slice(expressionStart, end).trim() : '';

    if (end < 0 || !expression) {
      cursor += opening.length;
      continue;
    }

    if (textStart < cursor)
      parts.push({ kind: 'text', value: source.slice(textStart, cursor) });
    parts.push({ kind: 'math', value: expression, display });
    cursor = end + closing.length;
    textStart = cursor;
  }

  if (textStart < source.length)
    parts.push({ kind: 'text', value: source.slice(textStart) });

  return parts.length ? parts : [{ kind: 'text', value: source }];
}
