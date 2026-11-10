import { describe, expect, it } from 'vitest';
import { excerpt, formatDate, readingTime } from './date';

describe('formatDate', () => {
  it('renders an ISO timestamp as a long date', () => {
    expect(formatDate('2026-03-14T10:00:00.000Z')).toBe('March 14, 2026');
  });

  it('returns an empty string rather than "Invalid Date" for bad input', () => {
    // A post row with a null created_at must not render NaN into the card.
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('readingTime', () => {
  it('never reports less than a minute', () => {
    expect(readingTime('one')).toBe('1 min read');
    expect(readingTime('')).toBe('1 min read');
  });

  it('rounds to the nearest minute at ~200 wpm', () => {
    expect(readingTime(Array(200).fill('word').join(' '))).toBe('1 min read');
    expect(readingTime(Array(600).fill('word').join(' '))).toBe('3 min read');
  });

  it('ignores runs of whitespace when counting words', () => {
    expect(readingTime('  a \n\n b \t c  ')).toBe('1 min read');
  });
});

describe('excerpt', () => {
  it('leaves short text untouched and adds no ellipsis', () => {
    expect(excerpt('Short body')).toBe('Short body');
  });

  it('collapses whitespace so newlines do not leak into the card', () => {
    expect(excerpt('line one\n\nline  two')).toBe('line one line two');
  });

  it('truncates on a word boundary and marks the cut', () => {
    const text = `${'word '.repeat(50)}end`;
    const result = excerpt(text, 20);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
    // Must not end mid-word before the ellipsis.
    expect(result).not.toMatch(/wor…$/);
  });

  it('does not add an ellipsis when the text is exactly the limit', () => {
    expect(excerpt('12345', 5)).toBe('12345');
  });
});
