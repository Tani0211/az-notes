'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileUp,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { parseFlashcardCsv } from '../lib/flashcard-csv';
import type { Flashcard, FlashcardSet } from '../lib/types';

type DeckMetadata = Pick<
  FlashcardSet,
  'name' | 'topic' | 'phase' | 'tag' | 'source' | 'status' | 'fileName'
>;

const emptyMetadata: DeckMetadata = {
  name: '',
  topic: '',
  phase: -1,
  tag: '',
  source: '',
  status: 'draft',
  fileName: '',
};

async function responseJson(response: Response) {
  return (await response.json()) as { error?: string };
}

export function AdminFlashcards({
  initialSets,
}: {
  initialSets: FlashcardSet[];
}) {
  const [sets, setSets] = useState(initialSets);
  const [importing, setImporting] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [metadata, setMetadata] = useState<DeckMetadata>(emptyMetadata);
  const [file, setFile] = useState<File | null>(null);
  const [newCard, setNewCard] = useState({ question: '', answer: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cardQuery, setCardQuery] = useState('');
  const [fileCheck, setFileCheck] = useState<{
    kind: 'ready' | 'error';
    text: string;
  } | null>(null);
  const active = sets.find((set) => set.id === activeId) || null;
  const visibleCards = active
    ? active.cards
        .map((card, index) => ({ card, index }))
        .filter(({ card }) =>
          `${card.question} ${card.answer}`
            .toLowerCase()
            .includes(cardQuery.trim().toLowerCase()),
        )
    : [];

  function clearNotices() {
    setError('');
    setMessage('');
  }

  function updateActive(change: Partial<FlashcardSet>) {
    if (!activeId) return;
    setSets((current) =>
      current.map((set) => (set.id === activeId ? { ...set, ...change } : set)),
    );
  }

  async function checkFile(selected: File | null) {
    setFile(selected);
    setFileCheck(null);
    if (!selected) return;
    if (selected.size > 2 * 1024 * 1024) {
      setFileCheck({
        kind: 'error',
        text: 'Choose a CSV file no larger than 2 MB.',
      });
      return;
    }
    try {
      const cards = parseFlashcardCsv(await selected.text());
      setFileCheck({
        kind: 'ready',
        text: `${cards.length} valid ${cards.length === 1 ? 'card' : 'cards'} ready to import.`,
      });
    } catch (reason) {
      setFileCheck({
        kind: 'error',
        text:
          reason instanceof Error ? reason.message : 'Could not read this CSV.',
      });
    }
  }

  async function importCsv(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    clearNotices();
    if (!file) {
      setError('Choose a CSV file to import.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Choose a CSV file no larger than 2 MB.');
      return;
    }
    setBusy('import');
    try {
      const cards = parseFlashcardCsv(await file.text());
      const response = await fetch('/api/flashcard-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify({
          metadata: { ...metadata, fileName: file.name },
          cards,
        }),
      });
      const result = (await response.json()) as FlashcardSet & {
        error?: string;
      };
      if (!response.ok) throw Error(result.error);
      setSets((current) => [result, ...current]);
      setMetadata(emptyMetadata);
      setFile(null);
      setFileCheck(null);
      setImporting(false);
      setMessage(
        `${result.cardCount} cards imported as a new, independent deck.`,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import failed.');
    } finally {
      setBusy('');
    }
  }

  async function saveDeck(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    clearNotices();
    setBusy('deck');
    try {
      const response = await fetch(`/api/flashcard-sets/${active.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify(active),
      });
      const result = await responseJson(response);
      if (!response.ok) throw Error(result.error);
      setMessage('Deck details saved.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not save deck.',
      );
    } finally {
      setBusy('');
    }
  }

  async function saveCard(card: Flashcard) {
    clearNotices();
    setBusy(card.id);
    try {
      const response = await fetch(`/api/flashcards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify(card),
      });
      const result = await responseJson(response);
      if (!response.ok) throw Error(result.error);
      setMessage('Flashcard saved.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not save card.',
      );
    } finally {
      setBusy('');
    }
  }

  async function addCard(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    clearNotices();
    setBusy('new-card');
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-az-notes-action': '1',
        },
        body: JSON.stringify({ setId: active.id, ...newCard }),
      });
      const result = (await response.json()) as Flashcard & { error?: string };
      if (!response.ok) throw Error(result.error);
      updateActive({
        cards: [...active.cards, result],
        cardCount: active.cardCount + 1,
      });
      setNewCard({ question: '', answer: '' });
      setMessage('Flashcard added to this deck.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not add card.',
      );
    } finally {
      setBusy('');
    }
  }

  async function removeCard(card: Flashcard) {
    if (!active || !window.confirm('Permanently delete this flashcard?'))
      return;
    clearNotices();
    setBusy(card.id);
    try {
      const response = await fetch(`/api/flashcards/${card.id}`, {
        method: 'DELETE',
        headers: { 'x-az-notes-action': '1' },
      });
      const result = await responseJson(response);
      if (!response.ok) throw Error(result.error);
      updateActive({
        cards: active.cards.filter((item) => item.id !== card.id),
        cardCount: Math.max(0, active.cardCount - 1),
      });
      setMessage('Flashcard deleted.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not delete card.',
      );
    } finally {
      setBusy('');
    }
  }

  async function removeDeck(set: FlashcardSet) {
    if (
      !window.confirm(
        `Permanently delete “${set.name}” and all ${set.cardCount} cards?`,
      )
    )
      return;
    clearNotices();
    setBusy('delete-deck');
    try {
      const response = await fetch(`/api/flashcard-sets/${set.id}`, {
        method: 'DELETE',
        headers: { 'x-az-notes-action': '1' },
      });
      const result = await responseJson(response);
      if (!response.ok) throw Error(result.error);
      setSets((current) => current.filter((item) => item.id !== set.id));
      setActiveId('');
      setMessage('Flashcard deck deleted.');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not delete deck.',
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      {error && <p className="notice error">{error}</p>}
      {message && <output className="notice">{message}</output>}
      {active ? (
        <section className="form-panel content-manager">
          <div className="form-heading">
            <div>
              <span className="section-kicker">MANAGE DECK</span>
              <h2>{active.name}</h2>
            </div>
            <button className="button" onClick={() => setActiveId('')}>
              <ArrowLeft size={15} /> All decks
            </button>
          </div>
          <form onSubmit={saveDeck}>
            <MetadataFields
              value={active}
              topics={sets.map((set) => set.topic)}
              onChange={updateActive}
            />
            <div className="form-actions split-actions">
              <button
                className="button danger"
                type="button"
                disabled={!!busy}
                onClick={() => void removeDeck(active)}
              >
                <Trash2 size={15} /> Delete deck
              </button>
              <button className="button primary" disabled={!!busy}>
                {busy === 'deck' ? 'Saving…' : 'Save deck details'}
              </button>
            </div>
          </form>
          <div className="manager-divider" />
          <div className="collection-title">
            <div>
              <h3>Cards in this upload</h3>
              <p>
                {cardQuery
                  ? `${visibleCards.length} of ${active.cards.length} cards shown`
                  : `${active.cards.length} question-and-answer pairs`}
              </p>
            </div>
          </div>
          <label className="search-field card-admin-search">
            <Search size={17} />
            <input
              type="search"
              value={cardQuery}
              maxLength={150}
              onChange={(event) => setCardQuery(event.target.value)}
              placeholder="Search questions or answers…"
              aria-label="Search cards in this deck"
            />
            {cardQuery && (
              <button
                type="button"
                aria-label="Clear card search"
                onClick={() => setCardQuery('')}
              >
                <X size={15} />
              </button>
            )}
          </label>
          <div className="card-editor-list">
            {visibleCards.map(({ card, index }) => (
              <div className="card-editor" key={card.id}>
                <span className="card-number">{index + 1}</span>
                <label>
                  Question
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={card.question}
                    onChange={(event) =>
                      updateActive({
                        cards: active.cards.map((item) =>
                          item.id === card.id
                            ? { ...item, question: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Answer
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={card.answer}
                    onChange={(event) =>
                      updateActive({
                        cards: active.cards.map((item) =>
                          item.id === card.id
                            ? { ...item, answer: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
                <div className="row-actions">
                  <button
                    className="button"
                    disabled={!!busy}
                    onClick={() => void saveCard(card)}
                  >
                    <Check size={14} /> Save
                  </button>
                  <button
                    className="icon-button danger"
                    disabled={!!busy}
                    aria-label={`Delete card ${index + 1}`}
                    onClick={() => void removeCard(card)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {!visibleCards.length && cardQuery && (
            <div className="empty-state compact-empty">
              <p>No cards match this search.</p>
            </div>
          )}
          <form className="new-card-form" onSubmit={addCard}>
            <h3>Add one card</h3>
            <div className="form-grid">
              <label>
                Question
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={newCard.question}
                  onChange={(event) =>
                    setNewCard((value) => ({
                      ...value,
                      question: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Answer
                <textarea
                  required
                  rows={3}
                  maxLength={5000}
                  value={newCard.answer}
                  onChange={(event) =>
                    setNewCard((value) => ({
                      ...value,
                      answer: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="button primary" disabled={!!busy}>
                <Plus size={15} /> Add card
              </button>
            </div>
          </form>
        </section>
      ) : importing ? (
        <section className="form-panel content-manager">
          <div className="form-heading">
            <div>
              <span className="section-kicker">NEW INDEPENDENT DECK</span>
              <h2>Import flashcards</h2>
            </div>
            <button className="button" onClick={() => setImporting(false)}>
              <ArrowLeft size={15} /> Back
            </button>
          </div>
          <div className="import-guide">
            <FileUp size={22} />
            <div>
              <strong>Prepare a UTF-8 CSV with exactly two columns</strong>
              <code>question,answer</code>
              <p>
                One row becomes one card. Commas or line breaks inside an answer
                must be wrapped in double quotes. Every upload creates a
                separate deck and never merges with an earlier CSV.
              </p>
              <p>
                Write inline math as <code>$x^2$</code> and display math as{' '}
                <code>$$x^2$$</code>. It renders automatically for students.
              </p>
              <a
                className="template-link"
                href="/templates/flashcards-template.csv"
                download
              >
                Download a correctly formatted sample CSV
              </a>
            </div>
          </div>
          <form onSubmit={importCsv}>
            <MetadataFields
              value={metadata}
              topics={sets.map((set) => set.topic)}
              onChange={(change) =>
                setMetadata((value) => ({ ...value, ...change }))
              }
            />
            <label className="csv-drop">
              <FileUp size={24} />
              <strong>{file ? file.name : 'Choose your flashcard CSV'}</strong>
              <span>CSV only · maximum 2 MB or 1,000 cards</span>
              <input
                required
                type="file"
                accept="text/csv,.csv"
                onChange={(event) => {
                  const selected = event.target.files?.[0] || null;
                  void checkFile(selected);
                  if (selected && !metadata.name)
                    setMetadata((value) => ({
                      ...value,
                      name: selected.name.replace(/\.csv$/i, ''),
                    }));
                }}
              />
            </label>
            {fileCheck && (
              <output className={`csv-check ${fileCheck.kind}`}>
                {fileCheck.kind === 'ready' && <Check size={15} />}
                {fileCheck.text}
              </output>
            )}
            <div className="form-actions">
              <span className="muted">
                Import as draft first if you want to review every card.
              </span>
              <button className="button primary" disabled={!!busy}>
                {busy === 'import' ? 'Importing…' : 'Import CSV as new deck'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="library-panel">
          <div className="library-heading">
            <div>
              <h2>Flashcard decks</h2>
              <span>
                Every CSV stays separate and keeps one shared set of metadata
              </span>
            </div>
            <button
              className="button primary"
              onClick={() => {
                clearNotices();
                setImporting(true);
              }}
            >
              <FileUp size={16} /> Import CSV
            </button>
          </div>
          <div className="deck-grid">
            {sets.map((set) => (
              <article className="deck-card" key={set.id}>
                <div className="deck-card-top">
                  <span className="topic-label">{set.topic}</span>
                  <span className={'status ' + set.status}>
                    {set.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <Layers3 size={27} />
                <h3>{set.name}</h3>
                <p>
                  {set.cardCount} cards
                  {set.phase >= 0 ? ` · Phase ${set.phase}` : ''}
                  {set.tag ? ` · ${set.tag}` : ''}
                </p>
                <small>Imported from {set.fileName || 'CSV'}</small>
                <button
                  className="button wide"
                  onClick={() => {
                    clearNotices();
                    setCardQuery('');
                    setActiveId(set.id);
                  }}
                >
                  <Pencil size={15} /> Manage deck
                </button>
              </article>
            ))}
          </div>
          {!sets.length && (
            <div className="empty-state">
              <Layers3 size={28} />
              <h3>No flashcards yet</h3>
              <p>Import your first question-and-answer CSV to begin.</p>
            </div>
          )}
        </section>
      )}
    </>
  );
}

function MetadataFields({
  value,
  topics,
  onChange,
}: {
  value: DeckMetadata;
  topics: string[];
  onChange: (change: Partial<DeckMetadata>) => void;
}) {
  return (
    <div className="form-grid">
      <label>
        Deck name
        <input
          required
          maxLength={120}
          value={value.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="e.g. Binary Search Quick Recall"
        />
      </label>
      <label>
        Topic
        <input
          required
          maxLength={80}
          list="flashcard-topics"
          value={value.topic}
          onChange={(event) => onChange({ topic: event.target.value })}
          placeholder="e.g. Binary Search"
        />
        <datalist id="flashcard-topics">
          {[...new Set(topics)].map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </datalist>
      </label>
      <label>
        Phase
        <select
          value={value.phase}
          onChange={(event) => onChange({ phase: Number(event.target.value) })}
        >
          <option value={-1}>Outside phases / general</option>
          {[0, 1, 2, 3, 4, 5].map((phase) => (
            <option key={phase} value={phase}>
              Phase {phase}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tag
        <input
          maxLength={200}
          value={value.tag}
          onChange={(event) => onChange({ tag: event.target.value })}
          placeholder="e.g. invariant, edge cases"
        />
      </label>
      <label>
        Source
        <input
          maxLength={500}
          value={value.source}
          onChange={(event) => onChange({ source: event.target.value })}
          placeholder="Lecture, book, or reference URL"
        />
      </label>
      <label>
        Visibility
        <select
          value={value.status}
          onChange={(event) =>
            onChange({ status: event.target.value as FlashcardSet['status'] })
          }
        >
          <option value="draft">Draft — admin only</option>
          <option value="published">Published — show on homepage</option>
        </select>
      </label>
    </div>
  );
}
