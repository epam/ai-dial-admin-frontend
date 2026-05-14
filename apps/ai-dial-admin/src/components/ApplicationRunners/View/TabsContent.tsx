'use client';

import { FC } from 'react';

import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import AppRunnerApplications from '@/src/components/ApplicationRunners/ConfigurationView/Applications';
import AppRunnerFeatures from '@/src/components/ApplicationRunners/ConfigurationView/Features';
import Parameters from '@/src/components/ApplicationRunners/ConfigurationView/Parameters';
import SchemeProperties from '@/src/components/ApplicationRunners/ConfigurationView/Properties';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedFormat: ExportFormat;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  selectedRunner: DialApplicationScheme;
  names: string[];
  isSkipRefresh: boolean;
  onChange: (runner: DialApplicationScheme, isSkipRefresh?: boolean) => void;
  initialAuditTab?: EntityViewTab;
}

const TabsContent: FC<Props> = ({
  activeTab,
  selectedFormat,
  names,
  roles,
  selectedRunner,
  interceptors,
  isSkipRefresh,
  onChange,
  initialAuditTab,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent
            entity={selectedRunner}
            view={ApplicationRoute.ApplicationRunners}
            id={selectedRunner.$id}
          >
            <SchemeProperties names={names} runner={selectedRunner} isImmutable={true} onChangeRunner={onChange} />
          </PropertiesTabContent>
        )}

        {activeTab === EntityViewTab.Parameters && (
          <Parameters runner={selectedRunner} onChangeRunner={onChange} isSkipRefresh={isSkipRefresh} />
        )}

        {activeTab === EntityViewTab.Features && (
          <AppRunnerFeatures runner={selectedRunner} onChangeRunner={onChange} />
        )}

        {activeTab === EntityViewTab.Interceptors && (
          <EntityInterceptors
            entity={selectedRunner}
            interceptors={interceptors}
            onChangeEntity={onChange}
            view={ApplicationRoute.ApplicationRunners}
          />
        )}

        {activeTab === EntityViewTab.Applications && (
          <AppRunnerApplications appRunner={selectedRunner} onChangeAppRunner={onChange} />
        )}

        {activeTab === EntityViewTab.AppRoutes && (
          <EntityRoutes
            isAppRunnerView={true}
            roles={roles}
            routes={selectedRunner['dial:applicationTypeRoutes']}
            onChangeRoutes={(routes) => onChange({ ...selectedRunner, ['dial:applicationTypeRoutes']: routes })}
            disabled={isReadOnlyAdmin}
          />
        )}

        {activeTab === EntityViewTab.Audit && (
          <EntityAudit
            entity={selectedRunner}
            view={ApplicationRoute.ApplicationRunners}
            initialAuditTab={initialAuditTab}
          />
        )}
      </>
    )
  );
};

export default TabsContent;
