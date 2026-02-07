/** Format a YYYY-MM-DD date string as dd/mm/yyyy */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
