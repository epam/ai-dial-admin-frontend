import { FC, useCallback, useEffect, useState } from 'react';

import { IconPlus, IconReload } from '@tabler/icons-react';
import { GridApi, GridReadyEvent, IRowNode } from 'ag-grid-community';
import { DialSwitch, DialPrimaryButton, DialNoDataContent, DialGhostButton } from '@epam/ai-dial-ui-kit';

import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { ButtonsI18nKey, EntitiesI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getRolesColumnDefs, getRolesGridData, isResetAvailable } from './utils';
import GridView from '../../Grid/GridWithColumnsPanel/GridWithColumnsPanel';

interface Props {
  entity: EntityRoleLimits;
  roles: DialRole[];
  isSkipRefresh: boolean;
  view: ApplicationRoute;
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
  onChangeTokensValue?: (value: number, data: DialRole, token: string) => void;
  onOpenAddModal?: () => void;
  onOpenInNewTab: (role?: DialRole) => void;
  onRemoveRole: (role?: DialRole) => void;
  onResetAllRolesToDefault: () => void;
  onResetToDefaultRole: (role?: DialRole) => void;
  onSetNoLimits: (role?: DialRole) => void;
  isResetToDefaultHidden: (api: GridApi, node: IRowNode) => boolean;
  isSetNoLimitsHidden: (api: GridApi, node: IRowNode) => boolean;
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
}) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi>();
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
  );

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        columnDefs: columns,
        rowData: data,
      });
    }
  }, [isSkipRefresh, columns, data, gridApi]);

  const onSwitchSpecificRoles = useCallback(
    (isPublic: boolean) => {
      onChangeEntity({ ...entity, isPublic: !isPublic, roleLimits: {} }, false);
    },
    [onChangeEntity, entity],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-row items-center justify-between h-[42px]">
        <div className="flex flex-row items-center">
          <h1 className="mr-3">
            {t(TabsI18nKey.Roles)}: {data.length}
          </h1>
          <DialSwitch
            isOn={!entity.isPublic}
            label={t(RolesI18nKey.AvailableSpecificRoles)}
            switchId="specificRoles"
            onChange={onSwitchSpecificRoles}
          />
        </div>

        <div className="flex flex-row gap-3">
          {isResetAvailable(entity) && (
            <DialGhostButton
              iconBefore={<IconReload {...BASE_BUTTON_ICON_PROPS} />}
              label={t(RolesI18nKey.ResetToDefaultLimits)}
              onClick={onResetAllRolesToDefault}
            />
          )}
          {!entity.isPublic && (
            <DialPrimaryButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.Add)}
              onClick={onOpenAddModal}
            />
          )}
        </div>
      </div>
      <GridView
        emptyDataTitle={t(EntitiesI18nKey.NoRoles)}
        additionalGridOptions={{ onGridReady, suppressCellFocus: true, suppressHeaderFocus: true }}
      />
    </div>
  );
};

export default RolesGrid;
