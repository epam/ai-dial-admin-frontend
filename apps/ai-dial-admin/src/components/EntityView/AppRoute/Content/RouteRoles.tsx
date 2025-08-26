'use client';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/src/components/Common/Button/Button';
import Switch from '@/src/components/Common/Switch/Switch';
import Grid from '@/src/components/Grid/Grid';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, RolesI18nKey, RoutesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import AddEntitiesGrid from '../../AddEntitiesGrid';
import NoDataContent from '@/src/components/Common/NoData/NoData';

interface Props {
  parentRoles?: string[];
  roles: DialRole[];
  readonly?: boolean;
  route: DialAppRoute;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteRoles: FC<Props> = ({ route, parentRoles, readonly, onChangeRoute, roles }) => {
  const t = useI18n() as (str: string) => string;
  const [isInherited, setIsInherited] = useState((route.userRoles || []).length === 0);

  const data = useMemo(() => {
    return roles.filter((role) =>
      isInherited ? parentRoles?.includes(role.name as string) : route.userRoles?.includes(role.name as string),
    );
  }, [parentRoles, roles, isInherited, route.userRoles]);

  const availableRoles = useMemo(
    () => roles.filter((role) => !route.userRoles?.includes(role.name as string)),
    [roles, route.userRoles],
  );

  const [addModalState, setAddModalState] = useState(PopUpState.Closed);

  const onOpenAddModal = useCallback(() => {
    setAddModalState(PopUpState.Opened);
  }, [setAddModalState]);

  const onCloseAddModal = useCallback(() => {
    setAddModalState(PopUpState.Closed);
  }, [setAddModalState]);

  const onAddRoles = useCallback(
    (roles: DialRole[]) => {
      onCloseAddModal();
      onChangeRoute({
        ...route,
        userRoles: [...(route.userRoles || []), ...roles.map((r) => r.name as string)],
      });
    },
    [onCloseAddModal, onChangeRoute, route],
  );

  const onRemoveRole = useCallback(
    (role: DialRole) => {
      onCloseAddModal();
      onChangeRoute({
        ...route,
        userRoles: (route.userRoles || []).filter((r) => r !== role.name),
      });
    },
    [onCloseAddModal, onChangeRoute, route],
  );

  const onOpen = (role: DialRole) => {
    onOpenInNewTab(ApplicationRoute.Roles, role);
  };

  const columns = useMemo(() => {
    const actions = [getOpenInNewTabOperation(onOpen)];
    if (!isInherited) {
      actions.push(getRemoveOperation(onRemoveRole));
    }

    return [...SIMPLE_ENTITY_COLUMNS, ACTION_COLUMN(actions)];
  }, [isInherited, onRemoveRole]);

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {!readonly && (
          <Switch
            switchId="inheritedAppRoles"
            title={t(RoutesI18nKey.InheritApplicationRoles)}
            isOn={isInherited}
            onChange={(value) => {
              setIsInherited(value);
            }}
          />
        )}
        <div className="flex flex-row items-center w-full mt-4 mb-4 justify-between h-[38px]">
          <h1> {t(TabsI18nKey.Roles)}</h1>
          {!isInherited && !readonly && (
            <Button
              cssClass="secondary"
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={onOpenAddModal}
            />
          )}
        </div>
        <div className="flex-1 min-h-0">
          <div className="h-full">
            {data.length > 0 ? (
              <Grid columnDefs={columns} rowData={data} />
            ) : (
              <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoRoles)} />
            )}
          </div>
        </div>
      </div>
      {addModalState === PopUpState.Opened &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyTitle={t(EntitiesI18nKey.NoRoles)}
            modalState={addModalState}
            entities={availableRoles}
            onClose={onCloseAddModal}
            onApply={onAddRoles}
          />,
          document.body,
        )}
    </>
  );
};

export default RouteRoles;
