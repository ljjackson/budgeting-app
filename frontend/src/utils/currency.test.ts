import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, centsToDecimal, resolveAssignedInput } from './currency';

describe('formatCurrency', () => {
  it('formats positive cents', () => {
    expect(formatCurrency(1234)).toBe('£12.34');
  });
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('£0.00');
  });
  it('formats negative cents', () => {
    expect(formatCurrency(-500)).toBe('-£5.00');
  });
  it('formats large amounts', () => {
    expect(formatCurrency(100000)).toBe('£1,000.00');
  });
});

describe('parseCurrency', () => {
  it('parses decimal string to cents', () => {
    expect(parseCurrency('12.50')).toBe(1250);
  });
  it('returns 0 for NaN', () => {
    expect(parseCurrency('abc')).toBe(0);
  });
  it('returns 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0);
  });
  it('rounds correctly', () => {
    expect(parseCurrency('12.345')).toBe(1235);
  });
  it('handles negative values', () => {
    expect(parseCurrency('-5.50')).toBe(-550);
  });
});

describe('centsToDecimal', () => {
  it('converts cents to decimal string', () => {
    expect(centsToDecimal(1234)).toBe('12.34');
  });
  it('converts zero', () => {
    expect(centsToDecimal(0)).toBe('0.00');
  });
  it('pads decimals', () => {
    expect(centsToDecimal(100)).toBe('1.00');
  });
});

describe('resolveAssignedInput', () => {
  it('treats plain number as absolute', () => {
    expect(resolveAssignedInput('50.00', 2000)).toBe(5000);
  });
  it('handles + prefix as relative increase', () => {
    expect(resolveAssignedInput('+20', 2000)).toBe(4000);
  });
  it('handles - prefix as relative decrease', () => {
    expect(resolveAssignedInput('-5', 2000)).toBe(1500);
  });
  it('clamps to 0', () => {
    expect(resolveAssignedInput('-100', 2000)).toBe(0);
  });
  it('trims whitespace', () => {
    expect(resolveAssignedInput('  10  ', 0)).toBe(1000);
  });
});
