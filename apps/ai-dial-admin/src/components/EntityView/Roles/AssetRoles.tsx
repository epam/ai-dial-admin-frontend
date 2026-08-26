'use client';

import { DialNeutralButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import { getNoAvailableTitle } from '@/src/components/EntityView/Roles/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';

interface Props<T> {
  view: ApplicationRoute;
  asset: T;
  roles: DialRole[];
  onChange: (asset: T) => void;
}

/**
 * Edits `userRoles` — a flat list of role names — for any Core-direct asset whose resource extends
 * `RoleBasedEntity`. Deliberately edits membership only, rather than reusing the entity `Roles` tab
 * (`components/EntityView/Roles/utils.ts`'s `getRolesGridData`/`LIMIT_COLUMNS`): that tab also edits
 * `roleLimits`/`isPublic`/per-role share values, which are admin-BE constructs — DIAL Core keeps a
 * deployment's limits on the *Role* resource itself, not on the deployment/route, so a limit typed
 * against one of these resources would be silently dropped on save. Only membership is editable here
 * because membership is all Core stores on `RoleBasedEntity.userRoles`.
 *
 * Generic over the asset's resource type — shared by every Core-direct asset surface with a Roles
 * tab (`Assets > Models`, `Assets > Routes`), the same way `EntityInterceptors`
 * (`components/EntityView/Interceptors/Interceptors.tsx`) is shared across multiple entity/asset
 * surfaces' Interceptors tab.
 */
const AssetRoles = <T extends { userRoles?: string[] }>({ view, asset, roles, onChange }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Built from `userRoles` rather than by intersecting it with the fetched list, so a role the list
   * does not contain is still shown. Two ways that happens: the role list read failed (the detail
   * route degrades to `[]` rather than failing the page), or the role is declared in DIAL Core's
   * configuration file and the admin backend's own list can't see it. Intersecting would render "no
   * roles" while the asset still grants them — a silent misstatement of who has access.
   */
  const selectedRoles = useMemo(
    () =>
      (asset.userRoles || []).map(
        (name) => roles.find((role) => role.name === name) ?? ({ name, description: '' } as DialRole),
      ),
    [asset.userRoles, roles],
  );

  const availableRoles = useMemo(
    () => roles.filter((role) => !asset.userRoles?.includes(role.name as string)),
    [asset.userRoles, roles],
  );

  const onOpenModal = useCallback(() => setIsModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsModalOpen(false), []);

  const onAddRoles = useCallback(
    (added: DialRole[]) => {
      onCloseModal();
      const names = added.map((role) => role.name as string);
      onChange({ ...asset, userRoles: [...(asset.userRoles || []), ...names] });
    },
    [asset, onChange, onCloseModal],
  );

  const onRemoveRole = useCallback(
    (role?: DialRole) => {
      onChange({ ...asset, userRoles: (asset.userRoles || []).filter((name) => name !== role?.name) });
    },
    [asset, onChange],
  );

  const columnDefs = useMemo(
    () => (isReadOnlyAdmin ? BASE_COLUMNS : [...BASE_COLUMNS, ACTION_COLUMN([getRemoveOperation(onRemoveRole)])]),
    [isReadOnlyAdmin, onRemoveRole],
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {!isReadOnlyAdmin && (
        <div>
          <DialNeutralButton
            title={t(RolesI18nKey.AddRoles)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onOpenModal}
          />
        </div>
      )}

      {selectedRoles.length ? (
        <GridView rowData={selectedRoles} columnDefs={columnDefs} />
      ) : (
        <DialNoDataContent title={t(getNoAvailableTitle(view))} />
      )}

      <AddEntitiesGrid
        isModalOpen={isModalOpen}
        modalTitle={t(RolesI18nKey.AddRoles)}
        emptyTitle={t(ButtonsI18nKey.Add)}
        entities={availableRoles}
        onClose={onCloseModal}
        onApply={onAddRoles}
      />
    </div>
  );
};

export default AssetRoles;
