import { ApplicationRoute } from '@/src/types/routes';

/**
 * Characters `encodeURIComponent` leaves unescaped that Core's `ENTITY_NAME_PATTERN`
 * (`^[A-Za-z0-9._%:-]+$`, applied to the URL-decoded segment) rejects. An `$id` containing any of
 * them has no representable Core resource name at all.
 */
export const CORE_UNENCODABLE_ID_CHARS: readonly string[] = ['!', '~', '*', "'", '(', ')'];

/** Marks a string property whose value is a DIAL file Core copies on publish/share. */
export const DIAL_FILE_KEY = 'dial:file';

/** Views whose row name is a JSON-Schema `$id` — a URI, so `:` and `/` are inherent to it. */
export const SCHEMA_ID_NAMED_VIEWS: readonly ApplicationRoute[] = [
  ApplicationRoute.PlatformAppRunners,
  ApplicationRoute.PlatformCatalogSchemas,
];
