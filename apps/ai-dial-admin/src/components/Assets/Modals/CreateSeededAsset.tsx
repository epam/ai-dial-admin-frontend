'use client';

import { Tabs } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import CreatePlatformEntity from '@/src/components/Assets/Platform/CreatePlatformEntity';
import { AssetTabsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import CreateAsset from './CreateAsset';

type CreatableAssetSource = AssetSource.Public | AssetSource.Platform;

interface Props {
  view: ApplicationRoute;
  isOpen: boolean;
  initialValues?: Partial<AssetWithVersion>;
  /** The Public tree's folder state. */
  context: () => AssetsFolderContextReader<AssetListItem>;
  /** Names already taken on the Platform source, for the platform form's uniqueness check. */
  platformNames?: string[];
  runners?: DialApplicationScheme[];
  translators?: ResourceInfo[];
  defaultDestination?: CreatableAssetSource;
  onClose: () => void;
}

/**
 * The create popup for an entry point with no tab to imply where the entity goes (an app runner or an MCP
 * container creating an Application or Toolset). A **Destination** control picks Public (a folder in the
 * tree, versioned) or Platform (flat, unversioned) and renders the matching form with the same seed values.
 */
const CreateSeededAsset: FC<Props> = ({
  view,
  isOpen,
  initialValues,
  context,
  platformNames,
  runners,
  translators,
  defaultDestination = AssetSource.Public,
  onClose,
}) => {
  const t = useI18n();
  const [destination, setDestination] = useState<CreatableAssetSource>(defaultDestination);
  const onChangeDestination = useCallback((id: string) => setDestination(id as CreatableAssetSource), []);

  const topSlot = useMemo(
    () => (
      <Tabs
        ariaLabel={t(AssetTabsI18nKey.Destination)}
        tabs={[
          { id: AssetSource.Public, label: t(AssetTabsI18nKey.Public) },
          { id: AssetSource.Platform, label: t(AssetTabsI18nKey.Platform) },
        ]}
        activeTabId={destination}
        onTabChange={onChangeDestination}
      />
    ),
    [destination, onChangeDestination, t],
  );

  if (destination === AssetSource.Platform) {
    return (
      <CreatePlatformEntity
        key={destination}
        view={view}
        isOpen={isOpen}
        names={platformNames ?? []}
        runners={runners}
        translators={translators}
        initialValues={initialValues}
        topSlot={topSlot}
        onClose={onClose}
      />
    );
  }

  return (
    <CreateAsset
      key={destination}
      view={view}
      isModalOpen={isOpen}
      initialValues={initialValues}
      context={context}
      topSlot={topSlot}
      onClose={onClose}
    />
  );
};

export default CreateSeededAsset;
