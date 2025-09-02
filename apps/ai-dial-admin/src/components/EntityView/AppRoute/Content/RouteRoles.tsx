'use client';
import { IconPlus, IconReplace } from '@tabler/icons-react';
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
import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import { DialRoleLimitsMap } from '@/src/models/dial/role-limits';

interface Props {
  parentRoles?: string[];
  roles: DialRole[];
  readonly?: boolean;
  iAppRunnerView?: boolean;
  route: DialAppRoute;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteRoles: FC<Props> = ({ route, iAppRunnerView, parentRoles, readonly, onChangeRoute, roles }) => {
  const t = useI18n() as (str: string) => string;

  const data = useMemo(() => {
    const userRoles = Object.keys(route.roleLimits || {});
    return roles.filter((role) =>
      route.isPublic ? parentRoles?.includes(role.name as string) : userRoles?.includes(role.name as string),
    );
  }, [parentRoles, roles, route.isPublic, route.roleLimits]);

  const availableRoles = useMemo(() => {
    const userRoles = Object.keys(route.roleLimits || {});
    return roles.filter((role) => !userRoles?.includes(role.name as string));
  }, [roles, route.roleLimits]);

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
        roleLimits: {
          ...(route.roleLimits || []),
          ...roles.reduce((acc, role) => ({ ...acc, [role.name as string]: { enable: true } }), {}),
        } as DialRoleLimitsMap,
      });
    },
    [onCloseAddModal, onChangeRoute, route],
  );

  const onRemoveRole = useCallback(
    (role: DialRole) => {
      onCloseAddModal();

      const roleLimits = { ...(route.roleLimits || {}) };
      delete roleLimits[role.name as string];
      onChangeRoute({
        ...route,
        roleLimits,
      });
    },
    [onCloseAddModal, onChangeRoute, route],
  );

  const onOpen = (role: DialRole) => {
    onOpenInNewTab(ApplicationRoute.Roles, role);
  };

  const columns = useMemo(() => {
    const actions = [getOpenInNewTabOperation(onOpen)];
    if (!route.isPublic) {
      actions.push(getRemoveOperation(onRemoveRole));
    }

    return [...SIMPLE_ENTITY_COLUMNS, ACTION_COLUMN(actions)];
  }, [route, onRemoveRole]);

  return (
    <>
      <div className="h-full w-full flex flex-col">
        {!readonly && (
          <Switch
            switchId="inheritedAppRoles"
            title={t(RoutesI18nKey.InheritApplicationRoles)}
            isOn={route.isPublic}
            onChange={() => {
              onChangeRoute({
                ...route,
                isPublic: !route.isPublic,
                roleLimits: !route.isPublic ? {} : route.roleLimits, // clear role limits if switching to public
              });
            }}
          />
        )}
        <div className="flex flex-row items-center w-full mt-4 mb-4 justify-between h-[38px]">
          <h1> {t(TabsI18nKey.Roles)}</h1>
          {!route.isPublic && !readonly && (
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
            ) : iAppRunnerView && route.isPublic ? (
              <NoDataContent
                icon={<IconReplace width={60} height={60} />}
                emptyDataTitle={t(RoutesI18nKey.InheritRolesWarning)}
              />
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
