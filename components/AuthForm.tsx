'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp } from '@/lib/auth-client';
import Button from '@/components/Button';
import { friendlyAuthError } from '@/lib/utils';

type Mode = 'signin' | 'signup';

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const data = new FormData(e.currentTarget);
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    try {
      if (mode === 'signup') {
        const name = data.get('name') as string;
        const { error } = await signUp.email({ email, password, name });
        if (error) {
          setError(friendlyAuthError(error));
          return;
        }
      } else {
        const { error } = await signIn.email({ email, password });
        if (error) {
          setError(friendlyAuthError(error));
          return;
        }
      }
      router.push('/dashboard');
    } finally {
      setIsPending(false);
    }
  }

  const isSignUp = mode === 'signup';

  return (
    <div className='w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-background p-8 shadow-sm'>
      <h1 className='mb-6 text-2xl font-semibold tracking-tight'>
        {isSignUp ? 'Create an account' : 'Welcome back'}
      </h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        {isSignUp && (
          <label className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium'>Name</span>
            <input
              name='name'
              type='text'
              required
              autoComplete='name'
              placeholder='Your name'
              className='w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600'
            />
          </label>
        )}

        <label className='flex flex-col gap-1.5'>
          <span className='text-sm font-medium'>Email</span>
          <input
            name='email'
            type='email'
            required
            autoComplete='email'
            placeholder='you@example.com'
            className='w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600'
          />
        </label>

        <label className='flex flex-col gap-1.5'>
          <span className='text-sm font-medium'>Password</span>
          <input
            name='password'
            type='password'
            required
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder='••••••••'
            className='w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600'
          />
        </label>

        {error && <p className='text-sm text-red-500'>{error}</p>}

        <Button type='submit' disabled={isPending} className='mt-1 w-full'>
          {isPending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className='mt-6 text-center text-sm text-neutral-500'>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link
          href={isSignUp ? '/authenticate' : '/authenticate?mode=signup'}
          className='font-medium text-neutral-900 dark:text-neutral-100 underline underline-offset-2'
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </div>
  );
}
