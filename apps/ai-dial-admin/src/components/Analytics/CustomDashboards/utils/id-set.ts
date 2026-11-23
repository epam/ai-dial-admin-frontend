export const toggleId = (ids: ReadonlySet<string>, id: string, isIn: boolean): ReadonlySet<string> => {
  if (ids.has(id) === isIn) return ids;
  const next = new Set(ids);
  if (isIn) next.add(id);
  else next.delete(id);
  return next;
};
