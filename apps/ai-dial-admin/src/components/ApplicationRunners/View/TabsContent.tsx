'use client';

import { FC } from 'react';

import AppRunnerApplications from '@/src/components/ApplicationRunners/ConfigurationView/Applications';
import AppRunnerFeatures from '@/src/components/ApplicationRunners/ConfigurationView/Features';
import PropertiesTabContent from '@/src/components/ApplicationRunners/ConfigurationView/TabContent';
import ApplicationParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
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
  selectedRunner: DialApplicationScheme;
  roles: DialRole[];
  names: string[];
  interceptors: DialInterceptor[];
  onChange: (runner: DialApplicationScheme) => void;
}

const TabsContent: FC<Props> = ({
  activeTab,
  selectedFormat,
  names,
  roles,
  selectedRunner,
  interceptors,
  onChange,
}) => {
  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent names={names} selectedRunner={selectedRunner} onChange={onChange} />
        )}

        {activeTab === EntityViewTab.Parameters && (
          <ApplicationParametersTab view={ApplicationRoute.ApplicationRunners} entity={selectedRunner} />
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

        {activeTab === EntityViewTab.Routes && (
          <EntityRoutes
            iAppRunnerView={true}
            roles={roles}
            routes={selectedRunner['dial:applicationTypeRoutes']}
            onChangeRoutes={(routes) => onChange({ ...selectedRunner, ['dial:applicationTypeRoutes']: routes })}
          />
        )}

        {activeTab === EntityViewTab.Audit && (
          <EntityAudit entity={selectedRunner} view={ApplicationRoute.ApplicationRunners} />
        )}
      </>
    )
  );
};

export default TabsContent;
