/** HTTP methods Core's app-runner meta schema allows on a route. */
export const CORE_ROUTE_METHODS: readonly string[] = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Characters `encodeURIComponent` leaves unescaped that Core's `ENTITY_NAME_PATTERN`
 * (`^[A-Za-z0-9._%:-]+$`, applied to the URL-decoded segment) rejects. An `$id` containing any of
 * them has no representable Core resource name, so the id control rejects it while typing rather
 * than letting the save fail.
 */
export const CORE_UNENCODABLE_ID_CHARS: readonly string[] = ['!', '~', '*', "'", '(', ')'];
