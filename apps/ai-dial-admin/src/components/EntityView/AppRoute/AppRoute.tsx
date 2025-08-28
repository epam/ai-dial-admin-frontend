import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import HorizontalCollapseBar from '@/src/components/Common/HorizontalCollapseBar/HorizontalCollapseBar';
import RouteContent from '@/src/components/EntityView/AppRoute/Content/RouteContent';
import CreateRoute from '@/src/components/EntityView/AppRoute/CreateRoute';
import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimitsMap } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { DialAppRoute } from '@/src/models/dial/route';
import { PopUpState } from '@/src/types/pop-up';
import AppRouteList from './AppRouteList';

interface Props {
  roles?: DialRole[] | null;
  routes?: DialAppRoute[];
  parentRoleLimits?: DialRoleLimitsMap;
  readonly?: boolean;
  iAppRunnerView?: boolean;
  onChangeRoutes: (routes: DialAppRoute[]) => void;
}

const EntityRoutes: FC<Props> = ({ roles, parentRoleLimits, readonly, iAppRunnerView, routes, onChangeRoutes }) => {
  const t = useI18n() as (str: string) => string;

  const [modalState, setModalState] = useState(PopUpState.Closed);

  const [activeRoute, setActiveRoute] = useState<string | undefined>(undefined);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!activeRoute && routes?.length) {
      setActiveRoute(routes[0]?.name || '');
    }
  }, [routes, activeRoute]);

  useEffect(() => {
    setActiveRouteIndex((routes || []).findIndex((route) => route.name === activeRoute));
  }, [activeRoute, routes]);

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, []);

  const handleModalOpen = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, []);

  const onChangeRoute = useCallback(
    (route: DialAppRoute) => {
      if (routes) {
        routes[activeRouteIndex as number] = { ...route, name: route.displayName };
        onChangeRoutes([...(routes || [])]);
      }
    },
    [activeRouteIndex, onChangeRoutes, routes],
  );

  const onCreate = useCallback(
    (name: string) => {
      handleModalClose();
      onChangeRoutes([...(routes || []), { name, displayName: name } as DialAppRoute]);
    },
    [handleModalClose, onChangeRoutes, routes],
  );

  const onRemoveRoute = useCallback(
    (name?: string) => {
      onChangeRoutes(routes?.filter((route) => route.name !== name) || []);
    },
    [onChangeRoutes, routes],
  );

  return (
    <>
      <div className="flex flex-row gap-4 h-full w-full">
        <HorizontalCollapseBar width="296" title={t(TabsI18nKey.Routes)} containerClass="bg-layer-3">
          <div className="h-full relative flex flex-col">
            <div className="flex flex-row flex-wrap justify-between items-center mb-6">
              <h1>{t(TabsI18nKey.Routes)}</h1>
              {!readonly && (
                <Button
                  cssClass="primary"
                  iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                  title={t(ButtonsI18nKey.Add)}
                  onClick={handleModalOpen}
                />
              )}
            </div>
            <AppRouteList
              routes={routes}
              activeRoute={activeRoute}
              onClick={(tab) => setActiveRoute(tab)}
              onRemove={onRemoveRoute}
            />
          </div>
        </HorizontalCollapseBar>

        <div className="flex flex-col flex-1 min-h-0 min-w-0 relative border border-primary rounded">
          {routes?.[activeRouteIndex as number] && (
            <RouteContent
              iAppRunnerView={iAppRunnerView}
              route={routes?.[activeRouteIndex as number] || ({} as DialAppRoute)}
              roles={roles || []}
              parentRoles={Object.keys(parentRoleLimits || {})}
              onChangeRoute={onChangeRoute}
              readonly={readonly}
            />
          )}
        </div>
      </div>
      {modalState === PopUpState.Opened && (
        <CreateRoute modalState={modalState} onClose={handleModalClose} onCreate={onCreate} />
      )}
    </>
  );
};

export default EntityRoutes;
