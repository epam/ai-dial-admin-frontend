'use client';

import { FC } from 'react';

import AppRunnerFeatures from '@/src/components/ApplicationRunners/ConfigurationView/Features';
import ObjectAppRoutes from '@/src/components/Assets/ObjectAppRoutes/ObjectAppRoutes';
import {
  ObjectAppRouteFormat,
  ObjectAppRoutes as ObjectAppRoutesModel,
} from '@/src/components/Assets/ObjectAppRoutes/models';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import AppRunnerAssetParameters from './Parameters';
import AppRunnerAssetProperties from './Properties';
import { AppRunnerAssetTabsProps } from './models';

const TabsContent: FC<AppRunnerAssetTabsProps> = ({
  activeTab,
  runner,
  roles,
  interceptors,
  globalInterceptors,
  isSkipRefresh,
  onChange,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <>
      {activeTab === EntityViewTab.Properties && <AppRunnerAssetProperties runner={runner} onChange={onChange} />}

      {activeTab === EntityViewTab.Features && (
        <AppRunnerFeatures
          runner={runner as unknown as DialApplicationScheme}
          onChangeRunner={(scheme: DialApplicationScheme) =>
            onChange({ ...runner, ...scheme } as DialAppRunnerResource)
          }
        />
      )}

      {activeTab === EntityViewTab.Parameters && (
        <AppRunnerAssetParameters runner={runner} onChange={onChange} isSkipRefresh={isSkipRefresh} />
      )}

      {activeTab === EntityViewTab.AppRoutes && (
        <ObjectAppRoutes
          roles={roles}
          routes={runner['dial:applicationTypeRoutes'] as ObjectAppRoutesModel | undefined}
          format={ObjectAppRouteFormat.AppRunner}
          onChangeRoutes={(routes) =>
            onChange({ ...runner, 'dial:applicationTypeRoutes': routes } as DialAppRunnerResource)
          }
          disabled={isReadOnlyAdmin}
        />
      )}

      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={runner}
          interceptors={interceptors}
          globalInterceptors={globalInterceptors}
          onChangeEntity={onChange}
          view={ApplicationRoute.PlatformAppRunners}
        />
      )}
    </>
  );
};

export default TabsContent;
