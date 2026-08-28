'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconReload } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import { SHARING_COLUMNS } from '@/src/components/EntityView/Roles/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SharingGridData } from '@/src/components/Roles/models';
import { getDefaultPlaceholder, isResetToDefaultHidden } from '@/src/components/Roles/utils';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getResetOperation } from '@/src/constants/grid-columns/actions';
import { RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleResource } from '@/src/models/dial/resource';
import { applySharingChange, getAssetSharingData } from './utils';

interface Props {
  isSkipRefresh: boolean;
  selectedRole: DialRoleResource;
  onChangeRole: (role: DialRoleResource, withRefresh?: boolean) => void;
}

/**
 * Adapted from `Entities > Roles`' `RoleSharing` (`components/Roles/View/Properties/Sharing.tsx`),
 * reusing its grid columns/placeholder/reset-visibility helpers verbatim — but sourcing rows via
 * `getAssetSharingData` and writing through `toCoreShareField` instead, since Core's own
 * `ShareResourceLimit` is a different shape from the admin-backend's `DialRoleShare`: its two fields
 * are snake_case (`invitation_ttl`/`max_accepted_users`), and `invitationTtl` is already in hours on
 * the wire — no ms<->hours conversion, unlike the admin-backend field of the same name.
 */
const RoleSharing: FC<Props> = ({ isSkipRefresh, selectedRole, onChangeRole }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const gridApiRef = useRef<GridApi | null>(null);
  const entityRef = useRef(selectedRole);

  const onChangeTypeSharing = useCallback(
    (value: number, data: DialRole, token: string) => {
      onChangeRole(applySharingChange(entityRef.current, data.name as string, token, value), true);
    },
    [onChangeRole],
  );

  const onResetAllSharingToDefault = useCallback(() => {
    onChangeRole({
      ...selectedRole,
      share: {},
    });
  }, [onChangeRole, selectedRole]);

  const onResetSharingToDefault = useCallback(
    (data?: SharingGridData) => {
      if (data) {
        const share = {
          ...entityRef.current.share,
        };
        delete share[data.name];
        onChangeRole({
          ...entityRef.current,
          share,
        });
      }
    },
    [onChangeRole],
  );

  const isResetAvailable = useMemo(() => {
    return (
      selectedRole.share &&
      Object.values(selectedRole.share).some((record) =>
        Object.values(record).some((value) => value !== '' && value !== undefined && value !== null),
      )
    );
  }, [selectedRole.share]);

  const columns: ColDef[] = useMemo(() => {
    const baseColumns = SHARING_COLUMNS(t, onChangeTypeSharing, getDefaultPlaceholder, isReadOnlyAdmin);
    const actions = isReadOnlyAdmin ? [] : [getResetOperation(onResetSharingToDefault, isResetToDefaultHidden)];
    return [...baseColumns, ...(actions.length ? [ACTION_COLUMN(actions, true)] : [])];
  }, [onChangeTypeSharing, onResetSharingToDefault, t, isReadOnlyAdmin]);

  const data = getAssetSharingData(selectedRole);

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api ?? null;
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    entityRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApiRef.current?.isDestroyed()) {
      gridApiRef.current?.updateGridOptions({
        columnDefs: columns,
        rowData: data,
      });
    }
  }, [isSkipRefresh, columns, data]);

  useEffect(() => {
    gridApiRef.current?.refreshCells({ columns: [ACTIONS_COLUMN_CEL_ID], force: true });
  }, [data]);

  return (
    <div className="max-w-[750px] w-full flex flex-col">
      <div className="flex justify-between items-center mb-3 h-[40px]">
        <h1>{t(RolesI18nKey.Sharing)}</h1>
        {!isReadOnlyAdmin && isResetAvailable && (
          <DialGhostButton
            iconBefore={<IconReload {...BASE_BUTTON_ICON_PROPS} />}
            label={t(RolesI18nKey.ResetToDefaultLimits)}
            onClick={onResetAllSharingToDefault}
          />
        )}
      </div>
      <GridView onGridReady={onGridReady} />
    </div>
  );
};

export default RoleSharing;
