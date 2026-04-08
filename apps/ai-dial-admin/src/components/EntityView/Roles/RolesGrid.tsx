import { FC, useCallback, useEffect, useRef } from 'react';

import { DialGhostButton, DialPrimaryButton, DialSwitch } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconReload } from '@tabler/icons-react';
import { GridApi, GridOptions, GridReadyEvent, IRowNode } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, EntitiesI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getRolesColumnDefs, getRolesGridData, isResetAvailable } from './utils';

interface Props {
  entity: EntityRoleLimits;
  roles: DialRole[];
  isSkipRefresh: boolean;
  view: ApplicationRoute;
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
  onChangeTokensValue?: (value: number, data: DialRole, token: string) => void;
  onOpenAddModal?: () => void;
  onOpenInNewTab: (role?: DialRole) => void;
  onRemoveRole?: (role?: DialRole) => void;
  onResetAllRolesToDefault: () => void;
  onResetToDefaultRole?: (role?: DialRole) => void;
  onSetNoLimits?: (role?: DialRole) => void;
  isResetToDefaultHidden: (api: GridApi, node: IRowNode) => boolean;
  isSetNoLimitsHidden: (api: GridApi, node: IRowNode) => boolean;
  isReadOnlyAdmin?: boolean;
}

const RolesGrid: FC<Props> = ({
  entity,
  roles,
  view,
  onChangeEntity,
  onChangeTokensValue,
  onOpenAddModal,
  onOpenInNewTab,
  onRemoveRole,
  onResetToDefaultRole,
  onResetAllRolesToDefault,
  onSetNoLimits,
  isResetToDefaultHidden,
  isSetNoLimitsHidden,
  isSkipRefresh,
  isReadOnlyAdmin,
}) => {
  const t = useI18n();
  const gridApiRef = useRef<GridApi | null>(null);
  const data = getRolesGridData(entity, roles);

  const columns = getRolesColumnDefs(
    entity,
    onChangeTokensValue,
    onRemoveRole,
    onOpenInNewTab,
    onResetToDefaultRole,
    onSetNoLimits,
    isResetToDefaultHidden,
    isSetNoLimitsHidden,
    view,
    isReadOnlyAdmin,
  );

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api ?? null;
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

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

  const onSwitchSpecificRoles = useCallback(
    (isPublic: boolean) => {
      onChangeEntity({ ...entity, isPublic: !isPublic, roleLimits: {} }, false);
    },
    [onChangeEntity, entity],
  );

  const options: GridOptions = {
    suppressCellFocus: true,
    suppressHeaderFocus: true,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-row items-center justify-between h-[42px]">
        <div className="flex flex-row items-center">
          <h1 className="mr-3">
            {t(TabsI18nKey.Roles)}: {data.length}
          </h1>
          {!isReadOnlyAdmin && (
            <DialSwitch
              isOn={!entity.isPublic}
              label={t(RolesI18nKey.AvailableSpecificRoles)}
              switchId="specificRoles"
              onChange={onSwitchSpecificRoles}
            />
          )}
        </div>

        <div className="flex flex-row gap-3">
          {!isReadOnlyAdmin && isResetAvailable(entity) && (
            <DialGhostButton
              iconBefore={<IconReload {...BASE_BUTTON_ICON_PROPS} />}
              label={t(RolesI18nKey.ResetToDefaultLimits)}
              onClick={onResetAllRolesToDefault}
            />
          )}
          {!isReadOnlyAdmin && !entity.isPublic && onOpenAddModal && (
            <DialPrimaryButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.Add)}
              onClick={onOpenAddModal}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <GridView
          emptyDataProps={{ title: t(EntitiesI18nKey.NoRoles) }}
          onGridReady={onGridReady}
          additionalGridOptions={options}
          getIsEmptyData={() => !data.length}
        />
      </div>
    </div>
  );
};

export default RolesGrid;
