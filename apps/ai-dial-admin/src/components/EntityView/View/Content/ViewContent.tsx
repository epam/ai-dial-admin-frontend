'use client';
import { Dispatch, FC, SetStateAction, useMemo } from 'react';

import ApplicationParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import ApplicationAppRoutes from '@/src/components/EntityView/AppRoute/ApplicationAppRoutes';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import EntityDependencies from '@/src/components/EntityView/Dependencies/Dependencies';
import EntityFeatures from '@/src/components/EntityTabs/Features/Features';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesContent from './PropertiesContent';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';

interface Props {
  activeTab: EntityViewTab;
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  roles?: DialRole[] | null;
  interceptors?: DialInterceptor[] | null;
  applications?: DialApplication[] | null;
  models?: DialModel[] | null;
  view: ApplicationRoute;
  selectedEntity: BaseEntity;
  isJsonEditorEnabled: boolean;
  isSkipRefresh: boolean;
  isChanged?: boolean;
  key?: number;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setSelectedEntity?: Dispatch<SetStateAction<BaseEntity>>;
  onSave?: () => void;
  onChangeEntity: (entity: BaseEntity, isSkipRefresh?: boolean) => void;
}

const ViewContent: FC<Props> = ({
  activeTab,
  isJsonEditorEnabled,
  isSkipRefresh,
  isChanged,
  applicationSchemes,
  view,
  applications,
  interceptors,
  models,
  roles,
  selectedEntity,
  onSave,
  onChangeEntity,
  key,
  setIsChanged,
  setSelectedEntity,
  names,
}) => {
  const appRunner = useMemo(() => {
    if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
      return getAppRunner(selectedEntity as DialApplication, applicationSchemes);
    }
  }, [applicationSchemes, selectedEntity, view]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesContent
          names={names}
          applicationSchemes={applicationSchemes}
          view={view}
          selectedEntity={selectedEntity}
          onChangeEntity={onChangeEntity}
        />
      )}
      {activeTab === EntityViewTab.Features && (
        <EntityFeatures
          appRunner={appRunner}
          entity={selectedEntity as DialModel | DialApplication}
          onChangeEntity={onChangeEntity}
          view={view}
        />
      )}
      {activeTab === EntityViewTab.Routes && (
        <ApplicationAppRoutes
          roles={roles}
          applicationRunners={applicationSchemes || []}
          selectedEntity={selectedEntity as DialApplication}
          onChangeEntity={onChangeEntity}
        />
      )}
      {activeTab === EntityViewTab.Parameters && (
        <ApplicationParametersTab
          onSave={onSave}
          isChanged={isChanged}
          view={view}
          entity={selectedEntity}
          applicationSchemes={applicationSchemes}
          isJsonEditorEnabled={isJsonEditorEnabled}
          isSkipRefresh={isSkipRefresh}
          onChangeEntity={onChangeEntity}
          key={key}
          setIsChanged={setIsChanged}
          setSelectedEntity={setSelectedEntity}
        />
      )}
      {activeTab === EntityViewTab.Roles && (
        <EntityRoles
          entity={selectedEntity as EntityRoleLimits}
          view={view}
          roles={roles || []}
          onChangeEntity={onChangeEntity as (entity: EntityRoleLimits, withRefresh?: boolean) => void}
          isSkipRefresh={isSkipRefresh}
        />
      )}
      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={selectedEntity as DialModel | DialApplication}
          interceptors={interceptors || []}
          onChangeEntity={onChangeEntity}
          view={view}
        />
      )}
      {activeTab === EntityViewTab.Dependencies && (
        <EntityDependencies
          entity={selectedEntity}
          applications={applications || []}
          models={models || []}
          onChangeEntity={onChangeEntity}
        />
      )}
      {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedEntity} view={view} />}
    </>
  );
};

export default ViewContent;
