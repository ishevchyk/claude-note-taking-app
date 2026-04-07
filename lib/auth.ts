import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: getDb(),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
