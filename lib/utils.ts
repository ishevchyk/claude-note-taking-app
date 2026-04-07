export function relativeTime(dateStr: string): string {
  // SQLite stores datetime('now') as 'YYYY-MM-DD HH:MM:SS' (UTC, no 'Z').
  // Append 'Z' so JS parses it correctly as UTC.
  const normalized = dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const diff = (new Date(normalized).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const thresholds: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [2592000, 'day'],
    [31536000, 'month'],
  ];
  for (let i = 0; i < thresholds.length; i++) {
    const [secs, unit] = thresholds[i];
    if (Math.abs(diff) < secs) {
      const divisor = i > 0 ? thresholds[i - 1][0] : 1;
      return rtf.format(Math.round(diff / divisor), unit);
    }
  }
  return rtf.format(Math.round(diff / 2592000), 'month');
}

export function friendlyAuthError(error: { message?: string; code?: string }): string {
  const safe: Record<string, string> = {
    USER_ALREADY_EXISTS: 'An account with this email already exists.',
    INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password.',
    USER_NOT_FOUND: 'No account found with this email.',
  };
  return (error.code && safe[error.code]) ?? 'Something went wrong. Please try again.';
}
