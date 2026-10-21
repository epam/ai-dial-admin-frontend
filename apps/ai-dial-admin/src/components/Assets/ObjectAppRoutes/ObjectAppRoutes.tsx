'use client';

import { DialCollapsibleSidebar, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconDotsVertical, IconPlus, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import ActionsDropdown from '@/src/components/Common/ActionsDropdown/ActionsDropdown';
import RouteContent from '@/src/components/EntityView/AppRoute/Content/RouteContent';
import CreateRoute from '@/src/components/EntityView/AppRoute/CreateRoute';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { DialAppRoute } from '@/src/models/dial/route';
import { DialRole } from '@/src/models/dial/role';
import { ObjectAppRouteFormat, ObjectAppRoutes } from './models';
import { createObjectAppRoute, getObjectAppRouteMapper } from './utils';

interface Props {
  routes?: ObjectAppRoutes;
  format: ObjectAppRouteFormat;
  roles?: DialRole[] | null;
  disabled?: boolean;
  onChangeRoutes: (routes: ObjectAppRoutes) => void;
}

const ObjectAppRoutesView: FC<Props> = ({ routes, format, roles, disabled, onChangeRoutes }) => {
  const t = useI18n();
  const mapper = useMemo(() => getObjectAppRouteMapper(format), [format]);
  const routeNames = useMemo(() => Object.keys(routes ?? {}), [routes]);
  const [activeRouteName, setActiveRouteName] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeRouteName == null && routeNames.length) {
      setActiveRouteName(routeNames[0]);
    }
  }, [activeRouteName, routeNames]);

  useEffect(() => {
    if (activeRouteName != null && !routeNames.includes(activeRouteName)) {
      setActiveRouteName(routeNames[0] ?? null);
    }
  }, [activeRouteName, routeNames]);

  const activeRoute = useMemo(() => {
    if (activeRouteName == null || !routes?.[activeRouteName]) {
      return undefined;
    }
    return mapper.toRoute(activeRouteName, routes[activeRouteName]);
  }, [activeRouteName, mapper, routes]);

  const onChangeRoute = useCallback(
    (route: DialAppRoute) => {
      if (activeRouteName == null) {
        return;
      }
      const nextName = route.name || activeRouteName;
      const nextRoutes = { ...(routes ?? {}) };
      delete nextRoutes[activeRouteName];
      nextRoutes[nextName] = mapper.fromRoute(route, routes?.[activeRouteName]);
      onChangeRoutes(nextRoutes);
      setActiveRouteName(nextName);
    },
    [activeRouteName, mapper, onChangeRoutes, routes],
  );

  const onCreateRoute = useCallback(
    (name: string) => {
      const route = createObjectAppRoute(name);
      onChangeRoutes({ ...(routes ?? {}), [name]: mapper.fromRoute(route) });
      setActiveRouteName(name);
      setIsModalOpen(false);
    },
    [mapper, onChangeRoutes, routes],
  );

  const onRemoveRoute = useCallback(
    (name: string) => {
      const nextRoutes = { ...(routes ?? {}) };
      delete nextRoutes[name];
      onChangeRoutes(nextRoutes);
    },
    [onChangeRoutes, routes],
  );

  const getDeleteOperation = useCallback(
    (name: string): ActionMenuOperationDeclaration<DialAppRoute> => ({
      icon: <IconTrash {...BASE_BUTTON_ICON_PROPS} />,
      id: ActionMenuOperationI18nKey.Delete,
      label: t(ActionMenuOperationI18nKey.Delete),
      onClick: () => onRemoveRoute(name),
    }),
    [onRemoveRoute, t],
  );

  return (
    <>
      <div className="flex flex-row gap-4 size-full">
        <DialCollapsibleSidebar width={296} title={t(TabsI18nKey.AppRoutes)} containerClassName="bg-layer-3 mr-4">
          <div className="h-full relative flex flex-col">
            <div className="flex flex-row flex-wrap justify-between items-center mb-6">
              <h1>{t(TabsI18nKey.AppRoutes)}</h1>
              {!disabled && (
                <DialPrimaryButton
                  iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                  label={t(ButtonsI18nKey.Add)}
                  onClick={() => setIsModalOpen(true)}
                />
              )}
            </div>
            <div className="flex-1 min-h-0 flex flex-col relative gap-y-4 overflow-auto" role="tablist">
              {activeRouteName == null && <p>{t(EntitiesI18nKey.NoAppRoutes)}</p>}
              {routeNames.map((name) => (
                <div
                  key={name}
                  role="tab"
                  tabIndex={0}
                  aria-selected={activeRouteName === name}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                      return;
                    }
                    event.preventDefault();
                    setActiveRouteName(name);
                  }}
                  className={classNames(
                    'rounded group pl-3 py-2 flex flex-row gap-2 h-[32px] w-full small cursor-pointer hover:text-accent-primary',
                    activeRouteName === name
                      ? 'bg-accent-primary-alpha border-l-2 border-l-accent-primary'
                      : 'text-primary',
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 mr-0 text-left truncate"
                    onClick={() => setActiveRouteName(name)}
                  >
                    {name}
                  </button>
                  {!disabled && (
                    <div className="invisible group-hover:visible focus-within:visible text-primary mx-2 flex flex-row gap-2">
                      <ActionsDropdown
                        items={[getDeleteOperation(name)]}
                        icon={<IconDotsVertical {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialCollapsibleSidebar>

        <div className="flex flex-col flex-1 min-h-0 min-w-0 relative border border-primary rounded">
          {activeRoute && (
            <RouteContent
              route={activeRoute}
              roles={roles ?? []}
              parentRoles={roles?.map((role) => role.name as string)}
              routeNames={routeNames.filter((name) => name !== activeRouteName)}
              isAppRunnerView={format === ObjectAppRouteFormat.AppRunner}
              disabled={disabled}
              onChangeRoute={onChangeRoute}
            />
          )}
        </div>
      </div>
      {isModalOpen && (
        <CreateRoute
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={onCreateRoute}
          routeNames={routeNames}
        />
      )}
    </>
  );
};

export default ObjectAppRoutesView;
