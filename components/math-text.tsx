import katex from 'katex';
import { parseMathText } from '../lib/math';

export function MathText({ children }: { children: string }) {
  return (
    <span className="math-text">
      {parseMathText(children).map((part, index) => {
        if (part.kind === 'text') return part.value;

        const html = katex.renderToString(part.value, {
          displayMode: part.display,
          output: 'htmlAndMathml',
          strict: 'ignore',
          throwOnError: false,
          trust: false,
        });

        return (
          <span
            className={part.display ? 'math-display' : 'math-inline'}
            dangerouslySetInnerHTML={{ __html: html }}
            key={`${index}-${part.value}`}
          />
        );
      })}
    </span>
  );
}
