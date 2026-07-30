'use client';

import { FC } from 'react';

import AppRunnerFeatures from '@/src/components/ApplicationRunners/ConfigurationView/Features';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
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
  isSkipRefresh,
  onChange,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <>
      {activeTab === EntityViewTab.Properties && <AppRunnerAssetProperties runner={runner} onChange={onChange} />}

      {activeTab === EntityViewTab.Features && (
        <AppRunnerFeatures
          runner={runner}
          onChangeRunner={(scheme: DialApplicationScheme) =>
            onChange({ ...runner, ...scheme } as DialAppRunnerResource)
          }
        />
      )}

      {activeTab === EntityViewTab.Parameters && (
        <AppRunnerAssetParameters runner={runner} onChange={onChange} isSkipRefresh={isSkipRefresh} />
      )}

      {activeTab === EntityViewTab.AppRoutes && (
        <EntityRoutes
          roles={roles}
          routes={runner['dial:applicationTypeRoutes']}
          isAppRunnerView
          isAssetView
          onChangeRoutes={(routes) => onChange({ ...runner, 'dial:applicationTypeRoutes': routes })}
          disabled={isReadOnlyAdmin}
        />
      )}

      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={runner}
          interceptors={interceptors}
          onChangeEntity={onChange}
          view={ApplicationRoute.AssetsAppRunners}
        />
      )}
    </>
  );
};

export default TabsContent;
