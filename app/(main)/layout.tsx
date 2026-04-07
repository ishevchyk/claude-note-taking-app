import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Header from '@/components/Header';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/authenticate');

  const user = { name: session.user.name, email: session.user.email };

  return (
    <>
      <Header user={user} />
      {children}
    </>
  );
}
