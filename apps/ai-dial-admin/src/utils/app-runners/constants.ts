import { DIAL_META_PROPERTY_KIND, DIAL_META_PROPERTY_ORDER } from '@/src/components/Common/SchemaGrid/constants';

/** HTTP methods Core's app-runner meta schema allows on a route. */
export const CORE_ROUTE_METHODS: readonly string[] = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * `dial:meta` keys Core's app-runner meta schema requires on every top-level parameter, whatever its
 * `required` status. Nested properties carry no `dial:meta` at all.
 */
export const REQUIRED_PARAMETER_META_KEYS: readonly string[] = [DIAL_META_PROPERTY_ORDER, DIAL_META_PROPERTY_KIND];
