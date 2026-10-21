/**
 * Drains a Core continuation-token listing endpoint page by page into a flat row array. Every
 * paginated Core list (`AssetApi.list`, files' `getFiles`, skills' `getSkills`) follows the same
 * shape — fetch a page, map its node into rows, follow the token until a page stops returning
 * one — so this is the one implementation of that loop.
 *
 * Core reads the continuation marker from the request's `token` query param but returns it as
 * `nextToken` in the response body; sending `nextToken` back as `nextToken` is ignored and Core
 * re-serves the first page forever. Each caller's `fetchPage` already builds its request against
 * that asymmetry (see e.g. `AssetApi.getMetadata`) — this helper only threads the value through.
 */
export async function fetchAllPages<TNode extends { nextToken?: string } | null, TRow>(
  fetchPage: (nextToken?: string) => Promise<TNode>,
  mapPage: (node: TNode) => TRow[],
): Promise<TRow[]> {
  const items: TRow[] = [];
  let nextToken: string | undefined;
  do {
    const node = await fetchPage(nextToken);
    items.push(...mapPage(node));
    nextToken = node?.nextToken;
  } while (nextToken);
  return items;
}
