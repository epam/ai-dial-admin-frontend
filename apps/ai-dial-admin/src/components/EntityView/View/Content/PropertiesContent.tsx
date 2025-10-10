'use client';
import { FC, useCallback } from 'react';

import DeploymentAssetHeader from '@/src/components/Assets/Deployments/Header';
import AppProperties from '@/src/components/Assets/Apps/View/Properties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import EntityProperties from '@/src/components/EntityView/View/Content/Properties';
import ModelProperties from '@/src/components/ModelView/ModelProperties/ModelProperties';
import RouteProperties from '@/src/components/Routes/Properties/RouteProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialRoute } from '@/src/models/dial/route';
import { AssetToolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { isDeploymentAsset } from '@/src/utils/is-asset-view';

interface Props {
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  view: ApplicationRoute;
  etag?: string;
  assetApps?: DialAssetApp[] | null;
  selectedEntity: BaseEntity;
  onChangeEntity: (entity: BaseEntity) => void;
}

const PropertiesContent: FC<Props> = ({
  applicationSchemes,
  names,
  view,
  etag,
  assetApps,
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

    if (view === ApplicationRoute.AssetsApplications) {
      return (
        <AppProperties
          etag={etag as string}
          app={selectedEntity as DialAssetApp}
          apps={assetApps || []}
          onChangeApp={onChangeEntity}
        />
      );
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
  }, [view, selectedEntity, applicationSchemes, names, onChangeEntity, etag, assetApps]);

  return (
    <div className="flex flex-col h-full w-full">
      {isDeploymentAsset(view) ? (
        <DeploymentAssetHeader asset={selectedEntity as DialAssetApp | AssetToolset} />
      ) : (
        <EntityHeader entity={selectedEntity} />
      )}
      <div className="flex-1 min-h-0 pt-4">{getPropertiesView()}</div>
    </div>
  );
};

export default PropertiesContent;
