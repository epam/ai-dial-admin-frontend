'use client';
import { FC, useCallback } from 'react';

import AssetHeader from '@/src/components/Assets/Deployments/Header';
import DeploymentProperties from '@/src/components/Assets/Deployments/Properties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import EntityProperties from '@/src/components/EntityView/View/Content/Properties';
import ModelProperties from '@/src/components/ModelView/ModelProperties/ModelProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentAsset } from '@/src/utils/is-asset-view';

interface Props {
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  view: ApplicationRoute;
  selectedEntity: BaseEntity;
  onChangeEntity: (entity: BaseEntity) => void;
}

const PropertiesContent: FC<Props> = ({ applicationSchemes, names, view, selectedEntity, onChangeEntity }) => {
  const getPropertiesView = useCallback(() => {
    if (view === ApplicationRoute.Models) {
      return <ModelProperties model={selectedEntity} modelsNames={names} onChangeModel={onChangeEntity} />;
    }

    if (isDeploymentAsset(view)) {
      return (
        <DeploymentProperties
          view={view}
          asset={selectedEntity as DeploymentAsset}
          runners={applicationSchemes || []}
          onChange={onChangeEntity}
        />
      );
    }

    return (
      <EntityProperties
        entity={selectedEntity}
        runners={applicationSchemes || []}
        names={names}
        view={view}
        onChangeEntity={onChangeEntity}
      />
    );
  }, [view, selectedEntity, applicationSchemes, names, onChangeEntity]);

  return (
    <div className="flex flex-col h-full w-full">
      {isDeploymentAsset(view) ? (
        <AssetHeader asset={selectedEntity as DeploymentAsset} />
      ) : (
        <EntityHeader entity={selectedEntity} view={view} />
      )}
      <div className="flex-1 min-h-0 pt-8">{getPropertiesView()}</div>
    </div>
  );
};

export default PropertiesContent;
