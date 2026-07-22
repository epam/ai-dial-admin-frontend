'use client';

import { Dispatch, FC, SetStateAction, useMemo } from 'react';

import ParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import ApplicationAssetProperties from '@/src/components/Assets/Apps/Properties';
import ResourceFeatures from '@/src/components/Assets/Resources/ResourceFeatures';
import ContainerStatusBanner from '@/src/components/Deployments/Common/ContainerStatusBanner/ContainerStatusBanner';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import EntityFeatures from '@/src/components/EntityTabs/Features/Features';
import ApplicationAppRoutes from '@/src/components/EntityView/AppRoute/ApplicationAppRoutes';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import Tools from '@/src/components/Tools/Tools';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import Dependencies from './Dependencies/Dependencies';
import TabContent from './Properties/TabContent';

interface Props {
  view: ApplicationRoute;
  activeTab: EntityViewTab;
  applications: DialApplication[] | null;
  models: DialModel[] | null;
  roles?: DialRole[];
  interceptors: DialInterceptor[] | null;
  applicationSchemes: DialApplicationScheme[];
  selectedApplication: DialApplication;
  originalApplication?: DialApplication;
  isSkipRefresh: boolean;
  discardKey?: number;
  names: string[];
  isEditorEnabled: boolean;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setSelectedApplication?: Dispatch<SetStateAction<DialApplication>>;
  isChanged?: boolean;
  onSave?: () => void;
  onChangeApplication: (application: DialApplication) => void;
}

const TabsContent: FC<Props> = ({
  view,
  activeTab,
  applicationSchemes,
  selectedApplication,
  originalApplication,
  onChangeApplication,
  applications,
  names,
  interceptors,
  roles,
  models,
  isSkipRefresh,
  discardKey,
  isEditorEnabled,
  isChanged,
  onSave,
  setIsChanged,
  setSelectedApplication,
}) => {
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const appRunner = useMemo(() => {
    if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
      return getAppRunner(selectedApplication, applicationSchemes, view);
    }
  }, [applicationSchemes, selectedApplication, view]);

  const onChangeAsset = (application: DialApplicationResource) => {
    onChangeApplication(application as DialApplication);
  };

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <>
          {originalApplication?.source?.$type === SOURCE_TYPE.CONTAINER && originalApplication?.source?.containerId && (
            <ContainerStatusBanner
              view={ApplicationRoute.Applications}
              containerId={originalApplication.source.containerId}
            />
          )}
          {view === ApplicationRoute.AssetsApplications ? (
            <ApplicationAssetProperties
              asset={selectedApplication as DialApplicationResource}
              runners={applicationSchemes || []}
              onChange={onChangeAsset}
            />
          ) : (
            <TabContent
              selectedApp={selectedApplication}
              applicationSchemes={applicationSchemes || []}
              names={names}
              view={view}
              onChange={onChangeApplication}
            />
          )}
        </>
      )}

      {activeTab === EntityViewTab.Tools && (
        <Tools
          disabled={isReadOnlyAdmin}
          isAsset={view === ApplicationRoute.AssetsApplications}
          originalEntity={originalApplication}
          selectedEntity={selectedApplication}
          onChangeEntity={onChangeApplication}
          view={view}
          appRunner={appRunner}
        />
      )}

      {activeTab === EntityViewTab.Features &&
        (view === ApplicationRoute.AssetsApplications ? (
          <ResourceFeatures entity={selectedApplication as DialApplicationResource} onChangeEntity={onChangeAsset} />
        ) : (
          <EntityFeatures
            appRunner={appRunner}
            entity={selectedApplication}
            onChangeEntity={onChangeApplication}
            view={view}
          />
        ))}

      {activeTab === EntityViewTab.Parameters && (
        <ParametersTab
          onSave={onSave}
          isChanged={isChanged}
          view={view}
          application={selectedApplication}
          applicationSchemes={applicationSchemes}
          isEditorEnabled={isEditorEnabled}
          discardKey={discardKey}
          onChange={onChangeApplication}
          setIsChanged={setIsChanged}
          setSelectedApplication={setSelectedApplication}
        />
      )}
      {activeTab === EntityViewTab.Dependencies && (
        <Dependencies
          application={selectedApplication}
          applications={applications || []}
          models={models || []}
          onChange={onChangeApplication}
        />
      )}
      {activeTab === EntityViewTab.AppRoutes && (
        <ApplicationAppRoutes
          view={view}
          roles={roles}
          applicationRunners={applicationSchemes || []}
          selectedEntity={selectedApplication}
          onChangeEntity={onChangeApplication}
        />
      )}
      {activeTab === EntityViewTab.Roles && (
        <EntityRoles
          entity={selectedApplication}
          view={view}
          roles={roles || []}
          onChangeEntity={onChangeApplication}
          isSkipRefresh={isSkipRefresh}
        />
      )}
      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={selectedApplication}
          interceptors={interceptors || []}
          onChangeEntity={onChangeApplication}
          view={view}
        />
      )}

      {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedApplication} view={view} />}
    </>
  );
};

export default TabsContent;
