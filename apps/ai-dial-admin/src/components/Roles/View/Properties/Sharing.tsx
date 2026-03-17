'use client';

import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconReload } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import { SHARING_COLUMNS } from '@/src/components/EntityView/Roles/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { SharingGridData } from '@/src/components/Roles/models';
import {
  getDefaultPlaceholder,
  getMsFromHours,
  getSharingData,
  isResetToDefaultHidden,
} from '@/src/components/Roles/utils';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getResetOperation } from '@/src/constants/grid-columns/actions';
import { RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';

interface Props {
  isSkipRefresh: boolean;
  selectedRole: DialRole;
  onChangeRole: (role: DialRole, withRefresh?: boolean) => void;
}

const RoleSharing: FC<Props> = ({ isSkipRefresh, selectedRole, onChangeRole }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const gridApiRef = useRef<GridApi | null>(null);
  const entityRef = useRef(selectedRole);

  const onChangeTypeSharing = useCallback(
    (value: number, data: DialRole, token: string) => {
      const name = data.name as string;
      const newValue = {
        ...entityRef.current.share?.[name],
        [token]: token === 'invitationTtl' && value ? getMsFromHours(value) : value,
      };
      const share = {
        ...entityRef.current.share,
        [name]: newValue,
      };
      if (Object.values(newValue).every((val) => val === null || val === undefined || val === '')) {
        delete share[name];
      }
      const updatedEntity = {
        ...entityRef.current,
        share,
      };
      onChangeRole(updatedEntity, true);
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
    const actions = isReadOnlyAdmin
      ? []
      : [getResetOperation(onResetSharingToDefault, isResetToDefaultHidden)];
    return [...baseColumns, ...(actions.length ? [ACTION_COLUMN(actions, true)] : [])];
  }, [onChangeTypeSharing, onResetSharingToDefault, t, isReadOnlyAdmin]);

  const data = getSharingData(selectedRole);

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
