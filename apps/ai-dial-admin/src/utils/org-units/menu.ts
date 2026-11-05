import { MenuGroupConfiguration } from '@/src/components/Menu/menu-configuration';
import { UnitNamespace } from '@/src/models/user-access';
import { getRouteNamespace } from '@/src/utils/org-units/namespaces';

/** Namespaces whose menu item is offered only to a user who can write, since the page exists to edit. */
const WRITE_ONLY_NAMESPACES = new Set([UnitNamespace.ORG_UNITS]);

/**
 * The menu a unit user sees: only items whose namespace some unit lets them read (write, for
 * `WRITE_ONLY_NAMESPACES`). An item with no namespace (every platform and admin-backend page) is dropped, and
 * a group left empty goes with it.
 */
export const filterMenuForUnitMode = (
  config: MenuGroupConfiguration[],
  canReadNamespace: (namespace: UnitNamespace) => boolean,
  canWriteNamespace: (namespace: UnitNamespace) => boolean,
): MenuGroupConfiguration[] =>
  config
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const namespace = getRouteNamespace(item.href);
        if (namespace == null) {
          return false;
        }
        return WRITE_ONLY_NAMESPACES.has(namespace) ? canWriteNamespace(namespace) : canReadNamespace(namespace);
      }),
    }))
    .filter((group) => group.items.length > 0);
