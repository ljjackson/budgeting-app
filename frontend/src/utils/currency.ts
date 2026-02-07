const formatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

/** Format an integer cent amount as a currency string, e.g. 1234 → "£12.34" */
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100);
}

/** Convert a decimal pound string (e.g. from an input field) to integer cents. */
export function parseCurrency(value: string): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer cents to a decimal string for form inputs, e.g. 1234 → "12.34" */
export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Resolve an assignment input against a current value.
 *  Supports +/- prefixes for relative adjustments, e.g. "+20" adds £20, "-5" subtracts £5.
 *  Plain numbers are treated as absolute values. Result is clamped to 0. */
export function resolveAssignedInput(input: string, currentCents: number): number {
  const trimmed = input.trim();
  if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
    const delta = parseCurrency(trimmed);
    return Math.max(0, currentCents + delta);
  }
  return parseCurrency(trimmed);
}
