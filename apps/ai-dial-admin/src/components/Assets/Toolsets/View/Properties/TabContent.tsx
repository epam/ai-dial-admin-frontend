'use client';

import { FC, useMemo } from 'react';

import FoldersStorageLabel from '@/src/components/Assets/Header/FolderStorage';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { AuthHeader } from '@/src/components/Toolsets/Auth/Sections/AuthHeader';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import Properties from './Properties';

interface Props {
  selectedToolset: AssetToolset;
  onChange: (toolset: AssetToolset) => void;
}

const PropertiesTabContent: FC<Props> = ({ selectedToolset, onChange }) => {
  const t = useI18n();

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
    <div className="flex flex-col">
      <EntityInfoHeader
        id={selectedToolset.name}
        entity={selectedToolset}
        prefix={headerPrefix}
        postfix={headerPostfix}
      />

      <div className="flex-1 min-h-0 pt-8">
        <Properties selectedToolset={selectedToolset} onChange={onChange} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
