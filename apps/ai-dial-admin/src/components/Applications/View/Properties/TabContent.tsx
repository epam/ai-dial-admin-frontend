'use client';
import { FC } from 'react';

import ApplicationAssetProperties from '@/src/components/Assets/Apps/Properties';
import EntityProperties from '@/src/components/Applications/View/Properties/Properties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';

interface Props {
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  view: ApplicationRoute;
  selectedApp: BaseEntity;
  onChange: (entity: BaseEntity) => void;
}

const TabContent: FC<Props> = ({ applicationSchemes, names, view, selectedApp, onChange }) => {
  return (
    <PropertiesTabContent entity={selectedApp} view={view} id={selectedApp.name}>
      {view === ApplicationRoute.AssetsApplications ? (
        <ApplicationAssetProperties
          asset={selectedApp as DeploymentAsset}
          runners={applicationSchemes || []}
          onChange={onChange}
        />
      ) : (
        <EntityProperties
          entity={selectedApp}
          runners={applicationSchemes || []}
          names={names}
          view={view}
          onChangeEntity={onChange}
        />
      )}
    </PropertiesTabContent>
  );
};

export default TabContent;
