'use client';

import { ArrowRight, Layers3, RefreshCw, RotateCw } from 'lucide-react';
import { useState } from 'react';
import type { FlashcardView } from '../lib/types';
import { MathText } from './math-text';

export function FlashcardSpotlight({
  initialCard,
  initialTodayClicks,
}: {
  initialCard: FlashcardView;
  initialTodayClicks: number;
}) {
  const [card, setCard] = useState(initialCard);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [todayClicks, setTodayClicks] = useState(initialTodayClicks);

  async function another() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/flashcards/random', {
        method: 'POST',
        headers: { 'x-az-notes-action': '1' },
        cache: 'no-store',
      });
      const result = (await response.json()) as FlashcardView & {
        error?: string;
        todayClicks?: number;
      };
      if (!response.ok) throw Error(result.error);
      setCard(result);
      setTodayClicks(result.todayClicks ?? todayClicks + 1);
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
        <span className="recall-count" aria-live="polite">
          {todayClicks.toLocaleString('en-IN')} quick{' '}
          {todayClicks === 1 ? 'recall' : 'recalls'} today
        </span>
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
            <strong>
              <MathText>{card.question}</MathText>
            </strong>
            <span>
              <RotateCw size={15} /> Tap to reveal
            </span>
          </span>
          <span className="flashcard-face flashcard-back">
            <small>ANSWER</small>
            <strong>
              <MathText>{card.answer}</MathText>
            </strong>
            <span>
              <RotateCw size={15} /> Tap for question
            </span>
          </span>
        </span>
      </button>
    </section>
  );
}
