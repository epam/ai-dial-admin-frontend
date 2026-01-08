import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useState } from 'react';
import { DialPrimaryButton, DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import RouteContent from '@/src/components/EntityView/AppRoute/Content/RouteContent';
import CreateRoute from '@/src/components/EntityView/AppRoute/CreateRoute';
import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimitsMap } from '@/src/models/dial/role-limits';
import { DialAppRoute } from '@/src/models/dial/route';
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
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onChangeRoute = useCallback(
    (route: DialAppRoute) => {
      if (routes) {
        routes[activeRouteIndex as number] = route;
        onChangeRoutes([...(routes || [])]);
      }
    },
    [activeRouteIndex, onChangeRoutes, routes],
  );

  const onCreate = useCallback(
    (name: string) => {
      handleModalClose();
      onChangeRoutes([
        ...(routes || []),
        {
          name,
          displayName: name,
          upstreams: [],
          paths: [''],
          attachmentPaths: { requestBody: [''], responseBody: [''] },
        } as DialAppRoute,
      ]);
    },
    [handleModalClose, onChangeRoutes, routes],
  );

  const onRemoveRoute = useCallback(
    (name?: string) => {
      const newRoutes = routes?.filter((route) => route.name !== name) || [];
      const statusErrors = newRoutes.some(
        (r) => r.response?.status && (+r.response?.status < 100 || +r.response?.status > 999),
      );
      const methodErrors = newRoutes.some((r) => !r.methods?.length);

      dispatch({ type: ValidationActionType.SetField, field: 'status', isValid: !statusErrors });
      dispatch({ type: ValidationActionType.SetField, field: 'methods', isValid: !methodErrors });
      onChangeRoutes(newRoutes);
    },
    [dispatch, onChangeRoutes, routes],
  );

  return (
    <>
      <div className="flex flex-row gap-4 h-full w-full">
        <DialCollapsibleSidebar width={296} title={t(TabsI18nKey.Routes)} containerClassName="bg-layer-3 mr-4">
          <div className="h-full relative flex flex-col">
            <div className="flex flex-row flex-wrap justify-between items-center mb-6">
              <h1>{t(TabsI18nKey.Routes)}</h1>
              {!readonly && (
                <DialPrimaryButton
                  iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                  label={t(ButtonsI18nKey.Add)}
                  onClick={handleModalOpen}
                />
              )}
            </div>
            <AppRouteList
              readonly={readonly}
              routes={routes}
              activeRoute={activeRoute}
              onClick={(tab) => setActiveRoute(tab)}
              onRemove={onRemoveRoute}
            />
          </div>
        </DialCollapsibleSidebar>

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
      {isModalOpen && <CreateRoute isModalOpen={isModalOpen} onClose={handleModalClose} onCreate={onCreate} />}
    </>
  );
};

export default EntityRoutes;
