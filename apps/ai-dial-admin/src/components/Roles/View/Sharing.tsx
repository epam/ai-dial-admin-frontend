'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IconReload } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import { SHARING_COLUMNS } from '@/src/components/EntityView/Roles/utils';
import Grid from '@/src/components/Grid/Grid';
import { SharingGridData } from '@/src/components/Roles/models';
import {
  getDefaultPlaceholder,
  getMsFromHours,
  getSharingData,
  isResetToDefaultHidden,
} from '@/src/components/Roles/utils';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getResetOperation } from '@/src/constants/grid-columns/actions';
import { RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';

interface Props {
  isSkipRefresh: boolean;
  selectedRole: DialRole;
  onChangeRole: (role: DialRole, withRefresh?: boolean) => void;
}

const RoleSharing: FC<Props> = ({ isSkipRefresh, selectedRole, onChangeRole }) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi>();

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
  const entityRef = useRef(selectedRole);

  const columns: ColDef[] = useMemo(() => {
    return [
      ...SHARING_COLUMNS(t, onChangeTypeSharing, (node, colDef) => getDefaultPlaceholder(node, colDef)),
      ACTION_COLUMN(
        [getResetOperation(onResetSharingToDefault, (api, node) => isResetToDefaultHidden(api, node))],
        true,
      ),
    ];
  }, [onChangeTypeSharing, onResetSharingToDefault, t]);

  const data = getSharingData(selectedRole);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    entityRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        columnDefs: columns,
        rowData: data,
      });
    }
  }, [isSkipRefresh, columns, data, gridApi]);

  return (
    <div className="max-w-[750px] w-full flex flex-col">
      <div className="flex justify-between items-center mb-3 h-[40px]">
        <h1>{t(RolesI18nKey.Sharing)}</h1>
        {isResetAvailable && (
          <DialGhostButton
            iconBefore={<IconReload {...BASE_BUTTON_ICON_PROPS} />}
            label={t(RolesI18nKey.ResetToDefaultLimits)}
            onClick={onResetAllSharingToDefault}
          />
        )}
      </div>
      <Grid additionalGridOptions={{ onGridReady }} />
    </div>
  );
};

export default RoleSharing;
