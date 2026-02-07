import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formats YYYY-MM-DD to dd/mm/yyyy', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024');
  });
  it('handles single-digit day/month', () => {
    expect(formatDate('2024-01-05')).toBe('05/01/2024');
  });
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });
  it('returns input for malformed date', () => {
    expect(formatDate('not a date')).toBe('not a date');
  });
});
