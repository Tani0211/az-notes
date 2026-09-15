'use client';

import { ArrowRight, Layers3, RefreshCw, RotateCw } from 'lucide-react';
import { useState } from 'react';
import type { FlashcardView } from '../lib/types';

export function FlashcardSpotlight({
  initialCard,
}: {
  initialCard: FlashcardView;
}) {
  const [card, setCard] = useState(initialCard);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function another() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/flashcards/random', {
        cache: 'no-store',
      });
      const result = (await response.json()) as FlashcardView & {
        error?: string;
      };
      if (!response.ok) throw Error(result.error);
      setCard(result);
      setFlipped(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not load a card.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="recall-spotlight"
      aria-labelledby="quick-recall-heading"
    >
      <div className="recall-copy">
        <span className="section-kicker">
          <Layers3 size={14} /> QUICK RECALL
        </span>
        <h2 id="quick-recall-heading">One idea before you continue</h2>
        <p>
          A fresh card is selected randomly whenever this page opens. Tap it to
          reveal the explanation.
        </p>
        <div className="recall-meta">
          <span>{card.topic}</span>
          {card.phase >= 0 && <span>Phase {card.phase}</span>}
          {card.tag && <span>{card.tag}</span>}
        </div>
        <button
          className="button recall-next"
          disabled={busy}
          onClick={() => void another()}
        >
          {busy ? (
            <RefreshCw className="spin" size={16} />
          ) : (
            <ArrowRight size={16} />
          )}
          {busy ? 'Choosing…' : 'Another random card'}
        </button>
        {error && <p className="inline-error">{error}</p>}
      </div>
      <button
        className={'flashcard ' + (flipped ? 'is-flipped' : '')}
        aria-pressed={flipped}
        aria-label={flipped ? 'Show question' : 'Show answer'}
        onClick={() => setFlipped((value) => !value)}
      >
        <span className="flashcard-inner">
          <span className="flashcard-face flashcard-front">
            <small>QUESTION</small>
            <strong>{card.question}</strong>
            <span>
              <RotateCw size={15} /> Tap to reveal
            </span>
          </span>
          <span className="flashcard-face flashcard-back">
            <small>ANSWER</small>
            <strong>{card.answer}</strong>
            <span>
              <RotateCw size={15} /> Tap for question
            </span>
          </span>
        </span>
      </button>
    </section>
  );
}
