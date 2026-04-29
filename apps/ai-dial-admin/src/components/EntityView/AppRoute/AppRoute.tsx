import { DialCollapsibleSidebar, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import RouteContent from '@/src/components/EntityView/AppRoute/Content/RouteContent';
import CreateRoute from '@/src/components/EntityView/AppRoute/CreateRoute';
import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ORDER_DEFAULT_VALUE } from '@/src/constants/routes';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialRoleLimitsMap } from '@/src/models/dial/role-limits';
import { DialAppRoute } from '@/src/models/dial/route';
import { isValidRoutePath } from '@/src/utils/validation/path-error';
import { getErrorForAppRouteName } from '@/src/utils/validation/name-error';
import AppRouteList from './AppRouteList';

interface Props {
  roles?: DialRole[] | null;
  routes?: DialAppRoute[];
  parentRoleLimits?: DialRoleLimitsMap;
  disabled?: boolean;
  isPublicApp?: boolean;
  isAppRunnerView?: boolean;
  onChangeRoutes: (routes: DialAppRoute[]) => void;
}

const EntityRoutes: FC<Props> = ({
  roles,
  parentRoleLimits,
  isPublicApp,
  disabled,
  isAppRunnerView,
  routes,
  onChangeRoutes,
}) => {
  const t = useI18n();
  const { dispatch, isValid } = useSaveValidationContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);

  const routeNames = useMemo(() => {
    return routes?.map((r) => r.name || '');
  }, [routes]);

  useEffect(() => {
    if (activeRouteIndex == null && routes?.length) {
      setActiveRouteIndex(0);
    }
  }, [routes, activeRouteIndex]);

  // Aggregate validity for all app routes — covers name, paths, methods, endpoints
  useEffect(() => {
    if (!isAppRunnerView) return;

    const allValid = (routes || []).every((route, index) => {
      const otherNames = (routes || []).filter((_, i) => i !== index).map((r) => r.name || '');
      const nameValid = !getErrorForAppRouteName(route.name, otherNames, t);
      const pathsValid = !!route.paths?.length && route.paths.every((p) => !!p && isValidRoutePath(p));
      const methodsValid = !!route.methods?.length;
      const endpointsValid = !!route.response || !!route.upstreams?.length;
      return nameValid && pathsValid && methodsValid && endpointsValid;
    });

    dispatch({ type: ValidationActionType.SetField, field: 'appRoutes', isValid: allValid });
  }, [routes, isAppRunnerView, t, dispatch]);

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
          maxRetryAttempts: 1,
          order: ORDER_DEFAULT_VALUE,
        } as DialAppRoute,
      ]);
      setActiveRouteIndex(routes?.length || 0);
    },
    [handleModalClose, onChangeRoutes, routes],
  );

  const onRemoveRoute = useCallback(
    (name?: string) => {
      const newRoutes = routes?.filter((route) => route.name !== name) || [];
      onChangeRoutes(newRoutes);
    },
    [onChangeRoutes, routes],
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
                  onClick={handleModalOpen}
                  disabled={!isValid}
                />
              )}
            </div>
            <AppRouteList
              disabled={disabled}
              routes={routes}
              activeRouteIndex={activeRouteIndex}
              onClick={(index) => setActiveRouteIndex(index)}
              onRemove={onRemoveRoute}
            />
          </div>
        </DialCollapsibleSidebar>

        <div className="flex flex-col flex-1 min-h-0 min-w-0 relative border border-primary rounded">
          {routes?.[activeRouteIndex as number] && (
            <RouteContent
              isAppRunnerView={isAppRunnerView}
              route={routes?.[activeRouteIndex as number] || ({} as DialAppRoute)}
              roles={roles || []}
              parentRoles={!isPublicApp ? Object.keys(parentRoleLimits || {}) : roles?.map((r) => r.name as string)}
              onChangeRoute={onChangeRoute}
              disabled={disabled}
              routeNames={routeNames?.filter((_, index) => index !== activeRouteIndex)}
            />
          )}
        </div>
      </div>
      {isModalOpen && (
        <CreateRoute isModalOpen={isModalOpen} onClose={handleModalClose} onCreate={onCreate} routeNames={routeNames} />
      )}
    </>
  );
};

export default EntityRoutes;
