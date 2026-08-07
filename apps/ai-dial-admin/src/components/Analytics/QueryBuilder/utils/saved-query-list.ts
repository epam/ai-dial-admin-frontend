import { SavedQuery, SavedQueryGroup } from '@/src/models/analytics/saved-query';

// Search spans the fields a person would recall a query by. Deliberately not its body: matching SQL
// text would surface rows whose titles say nothing about why they matched.
export const filterSavedQueries = (queries: SavedQuery[], search: string): SavedQuery[] => {
  const term = search.trim().toLowerCase();
  if (!term) return queries;
  return queries.filter(
    (query) =>
      query.name.toLowerCase().includes(term) ||
      (query.description ?? '').toLowerCase().includes(term) ||
      (query.tag ?? '').toLowerCase().includes(term) ||
      (query.source ?? '').toLowerCase().includes(term),
  );
};

// Groups by tag, keeping first-seen tag order and — within a group — the order the service returned,
// which is most-recently-updated first. Untagged rows collect into one group rendered last, so a
// query without a tag is never hidden between tagged ones.
export const groupSavedQueriesByTag = (queries: SavedQuery[]): SavedQueryGroup[] => {
  const tagged = new Map<string, SavedQuery[]>();
  const untagged: SavedQuery[] = [];

  queries.forEach((query) => {
    const tag = query.tag?.trim();
    if (!tag) {
      untagged.push(query);
      return;
    }
    const bucket = tagged.get(tag);
    if (bucket) bucket.push(query);
    else tagged.set(tag, [query]);
  });

  const groups: SavedQueryGroup[] = [...tagged.entries()].map(([tag, items]) => ({ tag, queries: items }));
  if (untagged.length) groups.push({ queries: untagged });
  return groups;
};

// The tag vocabulary offered by the save dialog: the tags already in use at that scope. Kept separate
// per scope so one person's habits do not leak into everyone's list.
export const savedQueryTags = (queries: SavedQuery[]): string[] => {
  const tags = new Set<string>();
  queries.forEach((query) => {
    const tag = query.tag?.trim();
    if (tag) tags.add(tag);
  });
  return [...tags].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};
