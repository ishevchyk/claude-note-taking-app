import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { mockSignInEmail, mockSignUpEmail } = vi.hoisted(() => ({
  mockSignInEmail: vi.fn(),
  mockSignUpEmail: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  signIn: { email: mockSignInEmail },
  signUp: { email: mockSignUpEmail },
}));

import AuthForm from '@/components/AuthForm';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthForm (mode="signin")', () => {
  it('renders "Welcome back" heading', () => {
    render(<AuthForm mode='signin' />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('does not render name field', () => {
    render(<AuthForm mode='signin' />);
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    render(<AuthForm mode='signin' />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<AuthForm mode='signin' />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows link to sign up page', () => {
    render(<AuthForm mode='signin' />);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
});

describe('AuthForm (mode="signup")', () => {
  it('renders "Create an account" heading', () => {
    render(<AuthForm mode='signup' />);
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  it('renders name, email, and password fields', () => {
    render(<AuthForm mode='signup' />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows link to sign in page', () => {
    render(<AuthForm mode='signup' />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('AuthForm interactions', () => {
  it('shows error message from friendlyAuthError on failed signIn', async () => {
    mockSignInEmail.mockResolvedValue({ error: { code: 'INVALID_EMAIL_OR_PASSWORD' } });
    render(<AuthForm mode='signin' />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
    });
  });

  it('redirects to /dashboard on successful signIn', async () => {
    mockSignInEmail.mockResolvedValue({ error: null });
    render(<AuthForm mode='signin' />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects to /dashboard on successful signUp', async () => {
    mockSignUpEmail.mockResolvedValue({ error: null });
    render(<AuthForm mode='signup' />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Alice');
    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows "Please wait…" during submission', async () => {
    let resolve: (v: any) => void;
    mockSignInEmail.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<AuthForm mode='signin' />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Please wait\u2026')).toBeInTheDocument();
    resolve!({ error: null });
  });
});
