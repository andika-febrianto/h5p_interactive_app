/** Turns a label into a lowercase-hyphen slug, e.g. "Rataan Terumbu" -> "rataan-terumbu". */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'item';
}

/** Short random id for nested rows (questions, items, zones, markers) where
 *  the teacher shouldn't have to think about ids at all. */
export function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
