'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import Button from '@/components/Button';

type User = { name: string; email: string };

export default function Header({ user }: { user: User | null }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/authenticate');
  }

  return (
    <header className='border-b border-neutral-200 dark:border-neutral-800 bg-background px-6 py-4 flex items-center justify-between'>
      <Link
        href='/dashboard'
        className='text-xl font-bold text-foreground hover:opacity-70 transition-opacity'
      >
        Notes
      </Link>
      {user && (
        <div className='flex items-center gap-4'>
          <span className='text-sm text-neutral-500 dark:text-neutral-400'>{user.name}</span>
          <Button variant='ghost' size='sm' onClick={handleLogout}>
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
