'use client';

import { DialNeutralButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, KeysI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialKeyResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';

interface Props {
  asset: DialKeyResource;
  roles: DialRole[];
  onChange: (asset: DialKeyResource) => void;
}

/**
 * Edits the `roles` field on `DialKeyResource` — the roles the key bearer is granted when
 * authenticating with this key. Semantically distinct from `AssetRoles`, which edits `userRoles`
 * (the set of roles that may *access* the asset). Only the field name and empty-state label differ
 * from the asset-roles pattern.
 */
const KeyRoles = ({ asset, roles, onChange }: Props) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Built from `roles` directly so a role the list no longer contains is still shown — same
   * defensive rationale as in `AssetRoles`.
   */
  const selectedRoles = useMemo(
    () =>
      (asset.roles || []).map(
        (name) => roles.find((role) => role.name === name) ?? ({ name, description: '' } as DialRole),
      ),
    [asset.roles, roles],
  );

  const availableRoles = useMemo(
    () => roles.filter((role) => !asset.roles?.includes(role.name as string)),
    [asset.roles, roles],
  );

  const onOpenModal = useCallback(() => setIsModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsModalOpen(false), []);

  const onAddRoles = useCallback(
    (added: DialRole[]) => {
      onCloseModal();
      const names = added.map((role) => role.name as string);
      onChange({ ...asset, roles: [...(asset.roles || []), ...names] });
    },
    [asset, onChange, onCloseModal],
  );

  const onRemoveRole = useCallback(
    (role?: DialRole) => {
      onChange({ ...asset, roles: (asset.roles || []).filter((name) => name !== role?.name) });
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
        <DialNoDataContent title={t(KeysI18nKey.BearerRolesNotAvailable)} />
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

export default KeyRoles;
