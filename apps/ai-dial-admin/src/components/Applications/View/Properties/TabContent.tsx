'use client';
import { FC, useMemo } from 'react';

import EntityProperties from '@/src/components/Applications/View/Properties/Properties';
import ApplicationAssetProperties from '@/src/components/Assets/Apps/Properties';
import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { AssetApp, DeploymentAsset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  names: string[];
  applicationSchemes?: DialApplicationScheme[] | null;
  view: ApplicationRoute;
  selectedApp: DialApplication | AssetApp;
  onChange: (selectedApp: DialApplication | AssetApp) => void;
}

const TabContent: FC<Props> = ({ applicationSchemes, names, view, selectedApp, onChange }) => {
  const t = useI18n();
  const headerPostfix = useMemo(() => {
    return (
      <>
        {view === ApplicationRoute.AssetsApplications ? <FoldersStorageLabel asset={selectedApp as AssetApp} /> : null}
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <ValidityStatus validityState={selectedApp.validityState} />
        </LabelledText>
      </>
    );
  }, [selectedApp, t, view]);

  return (
    <PropertiesTabContent entity={selectedApp} view={view} id={selectedApp.name} headerPostfix={headerPostfix}>
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
