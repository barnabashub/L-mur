const dateFmt = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' });
const dateTimeFmt = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

export function formatDateTime(d: Date): string {
  return dateTimeFmt.format(d);
}

/** <input type="date"> értékhez: YYYY-MM-DD */
export function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
