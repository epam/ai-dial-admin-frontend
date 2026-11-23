'use client';
import { FC } from 'react';

import { getCatalogSchemaById } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import CreateApplication from '@/src/components/Assets/Entities/Apps/CreateApplication';
import ExportModal from '@/src/components/EntityListView/Export/ExportModal';
import ImportModal from '@/src/components/EntityListView/Import/ImportModal';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import DuplicateAsset from '@/src/components/Assets/Modals/DuplicateAsset';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { ModalType } from './types';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { ImportFileType } from '@/src/types/import';
import { ImportData } from '@/src/models/import-asset';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ServerActionResponse } from '@/src/models/server-action';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { DialFile, DialUploadFileItem } from '@epam/ai-dial-react-file-manager';
import DeleteAssetsModal from '@/src/components/Assets/Modals/DeleteAssetsModal';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  modalType: ModalType | null;
  preselectedItems?: File[];
  names?: string[];
  versionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  translators?: ResourceInfo[];
  isUnsafeImportEnabled?: boolean;
  duplicateItem?: AssetWithVersion | null;
  deletedItems?: DialFile[] | null;
  getContext: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
  onImport?: (
    fileType: ImportFileType,
    file: ImportData,
    resolution: string,
    path: string,
    ignorePaths?: boolean,
  ) => void;
  onExport?: (fileType: ImportFileType) => void;
  onCreate?: (asset: AssetWithVersion) => Promise<ServerActionResponse>;
  onDuplicate?: (entity: AssetWithVersion | DialPrompt) => void;
  onRemove: () => Promise<void>;
  onCreateFolder?: (_: DialUploadFileItem | undefined, folderPath: string) => Promise<ServerActionResponse>;
}

const ENTITY_BY_ID_GETTERS: Partial<Record<ApplicationRoute, (id: string) => Promise<ServerActionResponse>>> = {
  [ApplicationRoute.PlatformAppRunners]: getResolvedRunnerSchema,
  [ApplicationRoute.PlatformCatalogSchemas]: getCatalogSchemaById,
};

const Modals: FC<Props> = ({
  view,
  isModalOpen,
  modalType,
  names,
  versionsMap,
  runners,
  translators,
  isUnsafeImportEnabled,
  preselectedItems,
  duplicateItem,
  deletedItems,
  getContext,
  onClose,
  onImport,
  onExport,
  onCreate,
  onDuplicate,
  onRemove,
  onCreateFolder,
}) => {
  const entityNames = names || [];

  const renderCreateModal = () => {
    switch (view) {
      case ApplicationRoute.AssetsApplications:
        return (
          <CreateApplication
            isOpen={isModalOpen}
            names={entityNames}
            versionsMap={versionsMap}
            runners={runners}
            translators={translators}
            getContext={getContext}
            onClose={onClose}
            onCreate={onCreate}
          />
        );
      default:
        return (
          <CreateEntity
            context={getContext}
            route={view}
            isModalOpen={isModalOpen}
            onClose={onClose}
            createEntity={onCreate}
            getEntityById={ENTITY_BY_ID_GETTERS[view]}
            names={entityNames}
            versionsMap={versionsMap}
            runners={runners}
            isModal
          />
        );
    }
  };

  const renderDuplicateModal = () => {
    return (
      <DuplicateAsset
        context={getContext}
        view={view}
        isModalOpen={isModalOpen}
        onClose={onClose}
        entity={duplicateItem as AssetWithVersion}
        versionsMap={versionsMap}
        onDuplicate={onDuplicate}
        onCreateFolder={onCreateFolder}
      />
    );
  };

  if (!isModalOpen) {
    return null;
  }

  switch (modalType) {
    case ModalType.import:
      return (
        <ImportModal
          route={view}
          getAssetContext={getContext}
          isModalOpen={isModalOpen}
          onClose={onClose}
          onApply={onImport}
          preselectedItems={preselectedItems}
          isUnsafeImportEnabled={isUnsafeImportEnabled}
        />
      );
    case ModalType.create:
      return renderCreateModal();
    case ModalType.duplicate:
      return renderDuplicateModal();
    case ModalType.delete:
      return deletedItems ? (
        <DeleteAssetsModal
          context={getContext}
          view={view}
          isOpen={isModalOpen}
          onClose={onClose}
          itemsToDelete={deletedItems}
          onRemove={onRemove}
        />
      ) : null;
    case ModalType.export:
      return <ExportModal route={view} isModalOpen={isModalOpen} onClose={onClose} onApply={onExport} />;
    default:
      return null;
  }
};

export default Modals;
