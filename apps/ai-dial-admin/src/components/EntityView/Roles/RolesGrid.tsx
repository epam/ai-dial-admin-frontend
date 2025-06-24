import { FC, useCallback, useEffect, useState } from 'react';
import { GridApi, GridReadyEvent, IRowNode } from 'ag-grid-community';
import { IconPlus } from '@tabler/icons-react';

import Reset from '@/public/images/icons/reset.svg';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Grid from '@/src/components/Grid/Grid';
import { ButtonsI18nKey, EntitiesI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { getRolesColumnDefs, getRolesGridData, isResetAvailable } from './roles-utils';
import { DialRole } from '@/src/models/dial/role';
import Switch from '@/src/components/Common/Switch/Switch';

interface Props {
  entity: DialBaseEntity;
  roles: DialRole[];
  isSkipRefresh: boolean;

  onChangeEntity: (entity: DialBaseEntity, withRefresh?: boolean) => void;
  onChangeTokensValue?: (value: number, data: DialRole, token: string) => void;
  onOpenAddModal?: () => void;
  onOpenInNewTab: (role: DialRole) => void;
  onRemoveRole: (role: DialRole) => void;
  onResetAllRolesToDefault: () => void;
  onResetToDefaultRole: (role: DialRole) => void;
  onSetNoLimits: (role: DialRole) => void;
  isResetToDefaultHidden: (api: GridApi, node: IRowNode) => boolean;
  isSetNoLimitsHidden: (api: GridApi, node: IRowNode) => boolean;
}

const RolesGrid: FC<Props> = ({
  entity,
  roles,
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
  const t = useI18n() as (stringToTranslate: string) => string;
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
      onChangeEntity({ ...entity, isPublic: !isPublic }, false);
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
          <Switch
            isOn={!entity.isPublic}
            title={t(RolesI18nKey.AvailableSpecificRoles)}
            switchId="specific_roles"
            onChange={onSwitchSpecificRoles}
          />
        </div>

        <div className="flex flex-row gap-3">
          {isResetAvailable(entity) && (
            <Button
              cssClass="tertiary"
              iconBefore={<Reset />}
              title={t(RolesI18nKey.ResetToDefaultLimits)}
              onClick={onResetAllRolesToDefault}
            />
          )}
          {!entity.isPublic && (
            <Button
              cssClass="primary"
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={onOpenAddModal}
            />
          )}
        </div>
      </div>
      {!data.length ? (
        <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoRoles)} />
      ) : (
        <Grid additionalGridOptions={{ onGridReady }} />
      )}
    </div>
  );
};

export default RolesGrid;
