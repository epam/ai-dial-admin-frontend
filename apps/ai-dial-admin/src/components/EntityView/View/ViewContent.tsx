'use client';
import { FC, useCallback } from 'react';

import ApplicationParametersTab from '@/src/components/ApplicationParametersTab/ApplicationParametersTab';
import EntityProperties from '@/src/components/EntityProperties/EntityProperties';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityDependencies from '@/src/components/EntityView/Dependencies/Dependencies';
import EntityFeatures from '@/src/components/EntityView/Features/Features';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { EntityViewTab } from '@/src/components/EntityView/View/utils';
import ModelProperties from '@/src/components/ModelView/ModelProperties/ModelProperties';
import RouteProperties from '@/src/components/Routes/Properties/RouteProperties';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';

interface Props {
  activeTab: EntityViewTab;
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  roles?: DialRole[] | null;
  interceptors?: DialInterceptor[] | null;
  applications?: DialApplication[] | null;
  models?: DialModel[] | null;
  view: ApplicationRoute;
  selectedEntity: DialBaseEntity;
  jsonEditorEnabled: boolean;
  isSkipRefresh: boolean;
  onChangeEntity: (entity: DialBaseEntity) => void;
}

const ViewContent: FC<Props> = ({
  activeTab,
  jsonEditorEnabled,
  isSkipRefresh,
  applicationSchemes,
  names,
  view,
  applications,
  interceptors,
  models,
  roles,
  selectedEntity,
  onChangeEntity,
}) => {
  const getPropertiesView = useCallback(() => {
    if (view === ApplicationRoute.Models) {
      return <ModelProperties model={selectedEntity} modelsNames={names} updateModel={onChangeEntity} />;
    }

    if (view === ApplicationRoute.Routes) {
      return <RouteProperties route={selectedEntity as DialRoute} updateRoute={onChangeEntity} />;
    }

    return (
      <EntityProperties
        entity={selectedEntity}
        runners={applicationSchemes || []}
        names={names}
        view={view}
        updateEntity={onChangeEntity}
      />
    );
  }, [onChangeEntity, selectedEntity, applicationSchemes, names, view]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <div className="flex flex-col h-full w-full">
          <EntityHeader entity={selectedEntity} />
          <div className="flex-1 min-h-0">{getPropertiesView()}</div>
        </div>
      )}
      {activeTab === EntityViewTab.Features && (
        <EntityFeatures entity={selectedEntity} onChangeEntity={onChangeEntity} view={view} />
      )}
      {activeTab === EntityViewTab.Routes && (
        <EntityRoutes
          routes={(selectedEntity as DialApplication).routes}
          onChangeRoutes={(routes) => onChangeEntity({ ...selectedEntity, routes } as DialApplication)}
        />
      )}
      {activeTab === EntityViewTab.Parameters && (
        <ApplicationParametersTab
          entity={selectedEntity}
          applicationSchemes={applicationSchemes}
          jsonEditorEnabled={jsonEditorEnabled}
        />
      )}
      {activeTab === EntityViewTab.Roles && (
        <EntityRoles
          entity={selectedEntity}
          roles={roles || []}
          onChangeEntity={onChangeEntity}
          isSkipRefresh={isSkipRefresh}
        />
      )}
      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors entity={selectedEntity} interceptors={interceptors || []} onChangeEntity={onChangeEntity} />
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
