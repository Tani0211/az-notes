import postgres from 'postgres';

type Value = string | number | boolean | null;
type Row = Record<string, unknown>;

const preservedIdentifiers = new Map(
  [
    'driveUrl',
    'codeUrl',
    'fileKey',
    'updatedAt',
    'joinedAt',
    'lastSeen',
    'userId',
    'noteId',
    'lastPage',
    'createdAt',
    'addedBy',
  ].map((name) => [name.toLowerCase(), name]),
);

/** Convert the application's static SQLite-shaped queries, never user input. */
export function compileQuery(source: string) {
  const ignoredInsert = /^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(source);
  const input = ignoredInsert
    ? source.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i, 'INSERT INTO')
    : source;
  let text = '';
  let parameters = 0;
  let index = 0;

  while (index < input.length) {
    const rest = input.slice(index);
    const quote = input[index];
    if (quote === "'" || quote === '"') {
      const start = index++;
      let closed = false;
      while (index < input.length) {
        if (input[index++] !== quote) continue;
        if (input[index] === quote) {
          index++;
          continue;
        }
        closed = true;
        break;
      }
      if (!closed) throw new Error('Unclosed SQL quoted value.');
      text += input.slice(start, index);
      continue;
    }
    if (rest.startsWith('--')) {
      const end = input.indexOf('\n', index);
      const next = end === -1 ? input.length : end + 1;
      text += input.slice(index, next);
      index = next;
      continue;
    }
    if (rest.startsWith('/*')) {
      const end = input.indexOf('*/', index + 2);
      if (end === -1) throw new Error('Unclosed SQL comment.');
      text += input.slice(index, end + 2);
      index = end + 2;
      continue;
    }
    // PostgreSQL dollar-quoted literals must not have their content rewritten.
    const dollarQuote = rest.match(/^(\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$)/)?.[0];
    if (dollarQuote) {
      const end = input.indexOf(dollarQuote, index + dollarQuote.length);
      if (end === -1) throw new Error('Unclosed SQL dollar quote.');
      text += input.slice(index, end + dollarQuote.length);
      index = end + dollarQuote.length;
      continue;
    }
    if (quote === '?') {
      text += '$' + ++parameters;
      index++;
      continue;
    }
    if (quote === ';') {
      // A prepared statement may contain one query only. Migrations use their
      // separate trusted-file runner and never enter this adapter.
      if (input.slice(index + 1).trim())
        throw new Error('Only one SQL statement is allowed.');
      index++;
      continue;
    }
    if (/^\$\d/.test(rest))
      throw new Error('Use question-mark placeholders in application queries.');
    const identifier = rest.match(/^[A-Za-z_][A-Za-z_0-9]*/)?.[0];
    if (identifier) {
      const preserved = preservedIdentifiers.get(identifier.toLowerCase());
      text += preserved ? '"' + preserved + '"' : identifier;
      index += identifier.length;
      continue;
    }
    text += quote;
    index++;
  }

  if (ignoredInsert) text = text.trimEnd() + '\nON CONFLICT DO NOTHING';
  return { text, parameters };
}

export function parseSafeInteger(value: string) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed))
    throw new Error('A database integer exceeds the supported number range.');
  return parsed;
}

let connection: ReturnType<typeof postgres> | undefined;
function client() {
  if (connection) return connection;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not configured.');
  connection = postgres(url, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: 'require',
    types: {
      bigint: {
        to: 20,
        from: [20],
        serialize: (value: number) => String(value),
        parse: parseSafeInteger,
      },
    },
  });
  return connection;
}

class Statement {
  readonly query: ReturnType<typeof compileQuery>;
  constructor(
    source: string,
    readonly values: Value[] = [],
  ) {
    this.query = compileQuery(source);
  }

  bind(...values: Value[]) {
    const result = Object.create(Statement.prototype) as Statement;
    Object.assign(result, { query: this.query, values });
    return result;
  }

  async execute(sql = client()) {
    if (this.query.parameters !== this.values.length)
      throw new Error('The query parameter count does not match its bindings.');
    return sql.unsafe(this.query.text, this.values);
  }

  async all<T = Row>(): Promise<{ results: T[] }> {
    const rows = await this.execute();
    return { results: Array.from(rows) as T[] };
  }

  async first<T = Row>(): Promise<T | null> {
    const rows = await this.execute();
    return (rows[0] as T | undefined) ?? null;
  }

  async run() {
    const rows = await this.execute();
    return { success: true, meta: { changes: rows.count } };
  }
}

const database = {
  prepare(source: string) {
    return new Statement(source);
  },
  async batch(statements: Statement[]) {
    if (!statements.length) return [];
    return client().begin(async (transaction) => {
      const results = [];
      for (const statement of statements) {
        if (statement.query.parameters !== statement.values.length)
          throw new Error(
            'The query parameter count does not match its bindings.',
          );
        const rows = await transaction.unsafe(
          statement.query.text,
          statement.values,
        );
        results.push({ results: Array.from(rows), success: true });
      }
      return results;
    });
  },
};

export const db = () => database;
