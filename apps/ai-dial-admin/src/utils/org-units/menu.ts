import { MenuGroupConfiguration } from '@/src/components/Menu/menu-configuration';
import { UnitNamespace } from '@/src/models/user-access';
import { getRouteNamespace } from '@/src/utils/org-units/namespaces';

/**
 * The menu a unit user sees: only items whose namespace some unit lets them read. An item with no namespace
 * (every platform and admin-backend page) is dropped, and a group left empty goes with it.
 */
export const filterMenuForUnitMode = (
  config: MenuGroupConfiguration[],
  canReadNamespace: (namespace: UnitNamespace) => boolean,
): MenuGroupConfiguration[] =>
  config
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const namespace = getRouteNamespace(item.href);
        return namespace != null && canReadNamespace(namespace);
      }),
    }))
    .filter((group) => group.items.length > 0);
