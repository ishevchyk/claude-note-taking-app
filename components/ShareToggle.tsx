'use client';

import { useState, useEffect } from 'react';

type Props = {
  noteId: string;
  initialIsPublic: boolean;
  initialSlug: string | null;
};

export default function ShareToggle({ noteId, initialIsPublic, initialSlug }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicUrl = slug && origin ? `${origin}/p/${slug}` : null;

  async function handleToggle() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setIsPublic(data.isPublic);
      setSlug(data.publicSlug);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-4 py-3'>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-foreground'>Public sharing</p>
        {isPublic && publicUrl ? (
          <div className='mt-1 flex items-center gap-2'>
            <a
              href={publicUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xs text-blue-500 hover:underline truncate'
            >
              {publicUrl}
            </a>
            <button
              type='button'
              onClick={handleCopy}
              className='shrink-0 text-xs text-neutral-400 hover:text-foreground transition-colors'
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className='mt-0.5 text-xs text-neutral-400 dark:text-neutral-500'>Sharing is off</p>
        )}
      </div>
      <button
        type='button'
        role='switch'
        aria-checked={isPublic}
        disabled={isLoading}
        onClick={handleToggle}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${
          isPublic ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600'
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isPublic ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
