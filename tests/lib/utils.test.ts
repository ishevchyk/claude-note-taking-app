import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { relativeTime, friendlyAuthError } from '@/lib/utils';

// ─── relativeTime ────────────────────────────────────────────────────────────

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('normalizes SQLite format (no Z) by appending Z', () => {
    // 30 seconds ago — SQLite format without 'Z'
    const result = relativeTime('2025-06-01 11:59:30');
    expect(result).toMatch(/30 seconds ago/);
  });

  it('handles ISO format with Z unchanged', () => {
    const result = relativeTime('2025-06-01T11:59:30Z');
    expect(result).toMatch(/30 seconds ago/);
  });

  it('returns "just now" for timestamps within 1 second', () => {
    const result = relativeTime('2025-06-01 12:00:00');
    expect(result).toMatch(/now/i);
  });

  it('returns seconds ago for < 60 seconds', () => {
    const result = relativeTime('2025-06-01 11:59:45');
    expect(result).toMatch(/15 seconds ago/);
  });

  it('returns minutes ago for 1–60 minutes', () => {
    const result = relativeTime('2025-06-01 11:50:00');
    expect(result).toMatch(/10 minutes ago/);
  });

  it('returns hours ago for 1–24 hours', () => {
    const result = relativeTime('2025-06-01 08:00:00');
    expect(result).toMatch(/4 hours ago/);
  });

  it('returns days ago for 1–30 days', () => {
    const result = relativeTime('2025-05-25 12:00:00');
    expect(result).toMatch(/7 days ago/);
  });

  it('returns months ago for > 30 days', () => {
    const result = relativeTime('2025-01-01 12:00:00');
    expect(result).toMatch(/5 months ago/);
  });

  it('handles future timestamps', () => {
    const result = relativeTime('2025-06-01 12:05:00');
    expect(result).toMatch(/in 5 minutes/);
  });
});

// ─── friendlyAuthError ───────────────────────────────────────────────────────

describe('friendlyAuthError', () => {
  it('maps USER_ALREADY_EXISTS to friendly message', () => {
    expect(friendlyAuthError({ code: 'USER_ALREADY_EXISTS' })).toBe(
      'An account with this email already exists.',
    );
  });

  it('maps INVALID_EMAIL_OR_PASSWORD to friendly message', () => {
    expect(friendlyAuthError({ code: 'INVALID_EMAIL_OR_PASSWORD' })).toBe(
      'Invalid email or password.',
    );
  });

  it('maps USER_NOT_FOUND to friendly message', () => {
    expect(friendlyAuthError({ code: 'USER_NOT_FOUND' })).toBe('No account found with this email.');
  });

  it('returns generic message for unknown code', () => {
    expect(friendlyAuthError({ code: 'SOME_UNKNOWN_ERROR' })).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('returns generic message when code is undefined', () => {
    expect(friendlyAuthError({ message: 'Server error' })).toBe(
      'Something went wrong. Please try again.',
    );
  });

  it('returns generic message for empty object', () => {
    expect(friendlyAuthError({})).toBe('Something went wrong. Please try again.');
  });
});
