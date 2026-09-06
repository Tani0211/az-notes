'use client';
import { useState } from 'react';
export function GoogleSignIn({ ready }: { ready: boolean }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function signIn() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/auth/csrf');
      const d = (await r.json()) as { csrfToken?: string };
      if (!r.ok || !d.csrfToken)
        throw Error('Google sign-in is unavailable. Please try again.');
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/signin/google';
      for (const [name, value] of Object.entries({
        csrfToken: d.csrfToken,
        callbackUrl: window.location.origin + '/library',
      })) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="button wide google-button"
        disabled={!ready || busy}
        onClick={signIn}
      >
        <span className="google-letter" aria-hidden="true">
          G
        </span>
        {busy ? 'Connecting…' : 'Continue with Google'}
      </button>
      {!ready && (
        <p className="fineprint">
          Google sign-in is coming soon. ChatGPT sign-in is available now.
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
