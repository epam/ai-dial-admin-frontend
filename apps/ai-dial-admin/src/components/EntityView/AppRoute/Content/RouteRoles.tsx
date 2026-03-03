'use client';

import { DialNeutralButton, DialNoDataContent, DialSwitch } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconReplace } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import AddEntitiesGrid from '@/src/components/EntityView/AddEntitiesGrid';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, RolesI18nKey, RoutesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimitsMap } from '@/src/models/dial/role-limits';
import { DialAppRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  parentRoles?: string[];
  roles: DialRole[];
  readonly?: boolean;
  iAppRunnerView?: boolean;
  route: DialAppRoute;
  onChangeRoute: (route: DialAppRoute) => void;
}

const RouteRoles: FC<Props> = ({ route, iAppRunnerView, parentRoles, readonly, onChangeRoute, roles }) => {
  const t = useI18n();

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onOpenAddModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseAddModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

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
    (role?: DialRole) => {
      onCloseAddModal();

      const roleLimits = { ...(route.roleLimits || {}) };
      delete roleLimits[role?.name as string];
      onChangeRoute({
        ...route,
        roleLimits,
      });
    },
    [onCloseAddModal, onChangeRoute, route],
  );

  const onOpen = (role?: DialRole) => {
    onOpenInNewTab(ApplicationRoute.Roles, role);
  };

  const columns = useMemo(() => {
    const actions = [getOpenInNewTabOperation(onOpen)];
    if (!route.isPublic) {
      actions.push(getRemoveOperation(onRemoveRole));
    }

    return [...BASE_COLUMNS, ACTION_COLUMN(actions)];
  }, [route, onRemoveRole]);

  return (
    <>
      <div className="size-full flex flex-col">
        {!readonly && (
          <DialSwitch
            switchId="inheritedAppRoles"
            label={t(RoutesI18nKey.InheritApplicationRoles)}
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
        <div className="flex flex-row items-center w-full mt-4 mb-4 justify-between h-[40px]">
          <h1> {t(TabsI18nKey.Roles)}</h1>
          {!route.isPublic && !readonly && (
            <DialNeutralButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.Add)}
              onClick={onOpenAddModal}
            />
          )}
        </div>
        <div className="flex-1 min-h-0">
          <div className="h-full">
            {data.length > 0 ? (
              <GridView columnDefs={columns} rowData={data} />
            ) : iAppRunnerView && route.isPublic ? (
              <DialNoDataContent
                icon={<IconReplace size={60} stroke={0.5} />}
                title={t(RoutesI18nKey.InheritRolesWarning)}
              />
            ) : (
              <DialNoDataContent title={t(EntitiesI18nKey.NoRoles)} />
            )}
          </div>
        </div>
      </div>
      {isModalOpen &&
        createPortal(
          <AddEntitiesGrid
            modalTitle={t(RolesI18nKey.AddRoles)}
            emptyTitle={t(EntitiesI18nKey.NoRoles)}
            isModalOpen={isModalOpen}
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
