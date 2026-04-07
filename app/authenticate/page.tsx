import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AuthForm from '@/components/AuthForm';

export default async function AuthenticatePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  const { mode } = await searchParams;

  return (
    <main className='min-h-screen flex items-center justify-center bg-background px-4'>
      <AuthForm mode={mode === 'signup' ? 'signup' : 'signin'} />
    </main>
  );
}
