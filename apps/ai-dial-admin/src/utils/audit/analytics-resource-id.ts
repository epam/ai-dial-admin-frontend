/**
 * The analytics backend names a column activity `<table>:<column>`, so `:` is the
 * one separator inside an analytics resource identifier. A table, a pipeline and a
 * saved query carry a bare name.
 */
const ANALYTICS_RESOURCE_ID_SEPARATOR = ':';

/**
 * Resolve the table an analytics resource identifier belongs to: the part before
 * the first separator for a `TableColumn`, the whole value for a bare table name.
 *
 * @param {string} [resourceId] - an analytics activity's resource identifier
 * @returns {string | undefined} the table half of the identifier, or `undefined` when there is no identifier
 */
export const getTableNameFromAnalyticsResourceId = (resourceId?: string): string | undefined => {
  if (resourceId == null) {
    return undefined;
  }

  const separatorIndex = resourceId.indexOf(ANALYTICS_RESOURCE_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return resourceId;
  }

  return resourceId.slice(0, separatorIndex);
};

/**
 * Whether an analytics resource identifier belongs to the given table — the table
 * definition itself or one of its columns.
 *
 * The activity feed is queried with the `co` (contains) operator, which is a substring
 * match: a request narrowed to `orders` also answers with activities for `my_orders` and
 * for the column `my_orders:total`. This predicate is the exactness check that keeps
 * another table's history out of the tab, so neither `includes` nor a bare `startsWith`
 * is sufficient — the identifier must be the table name exactly, or the table name
 * followed by the separator.
 *
 * @param {string} [resourceId] - an analytics activity's resource identifier
 * @param {string} [tableName] - the name of the table whose audit surface is being rendered
 * @returns {boolean} true when the identifier is the table itself or one of its columns
 */
export const isResourceIdInTableScope = (resourceId?: string, tableName?: string): boolean => {
  if (!resourceId || !tableName) {
    return false;
  }

  return resourceId === tableName || resourceId.startsWith(`${tableName}${ANALYTICS_RESOURCE_ID_SEPARATOR}`);
};
