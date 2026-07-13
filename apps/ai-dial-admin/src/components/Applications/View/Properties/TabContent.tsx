'use client';
import { FC, useMemo } from 'react';

import EntityProperties from '@/src/components/Applications/View/Properties/Properties';
import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import ValidityStatusLabel from '@/src/components/Common/ValidityStatus/ValidityStatusLabel';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  view: ApplicationRoute;
  selectedApp: DialApplication | AssetApp;
  onChange: (selectedApp: DialApplication | AssetApp) => void;
}

const TabContent: FC<Props> = ({ applicationSchemes, names, view, selectedApp, onChange }) => {
  const headerPostfix = useMemo(() => {
    return (
      <>
        {view === ApplicationRoute.AssetsApplications ? <FoldersStorageLabel asset={selectedApp as AssetApp} /> : null}
        <ValidityStatusLabel valid={selectedApp.validityState?.valid} message={selectedApp.validityState?.message} />
      </>
    );
  }, [selectedApp, view]);

  return (
    <PropertiesTabContent entity={selectedApp} view={view} id={selectedApp.name} headerPostfix={headerPostfix}>
      <EntityProperties
        entity={selectedApp}
        runners={applicationSchemes || []}
        names={names}
        view={view}
        onChangeEntity={onChange}
      />
    </PropertiesTabContent>
  );
};

export default TabContent;
