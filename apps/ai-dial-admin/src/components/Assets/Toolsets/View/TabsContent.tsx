'use client';

import { FC, useMemo } from 'react';

import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import Tools from '@/src/components/Tools/Tools';
import { AuthHeader } from '@/src/components/Toolsets/Auth/Sections/AuthHeader';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { Toolset } from '@/src/models/dial/toolset';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import Properties from './Properties/Properties';

interface Props {
  activeTab: EntityViewTab;
  originalToolset: AssetToolset;
  selectedToolset: AssetToolset;
  onChange: (toolset: AssetToolset) => void;
}

const TabsContent: FC<Props> = ({ activeTab, onChange, selectedToolset, originalToolset }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const headerPostfix = useMemo(() => {
    return (
      <>
        <AuthHeader toolset={selectedToolset} />
        <FoldersStorageLabel asset={selectedToolset} />
      </>
    );
  }, [selectedToolset]);

  const headerPrefix = useMemo(() => {
    return selectedToolset.author ? (
      <LabelledText label={t(EntitiesI18nKey.Author)} text={selectedToolset.author} />
    ) : null;
  }, [selectedToolset.author, t]);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent
          entity={selectedToolset}
          view={ApplicationRoute.AssetsToolsets}
          id={selectedToolset.name}
          headerPostfix={headerPostfix}
          headerPrefix={headerPrefix}
        >
          <Properties selectedToolset={selectedToolset} onChange={onChange} />
        </PropertiesTabContent>
      )}

      {activeTab === EntityViewTab.Tools && (
        <Tools
          isAssetToolset
          originalToolset={originalToolset}
          selectedToolset={selectedToolset}
          onChangeToolset={onChange as (toolset: Toolset) => void}
          disabled={isReadOnlyAdmin}
        />
      )}

      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedToolset} view={ApplicationRoute.AssetsToolsets} />
      )}
    </>
  );
};

export default TabsContent;
