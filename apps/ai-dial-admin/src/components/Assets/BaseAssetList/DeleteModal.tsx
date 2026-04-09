'use client';

import { FC, useCallback } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import {
  AlertVariant,
  ConfirmationPopupVariant,
  DialAlert,
  DialConfirmationPopup,
  DialFile,
  DialFileNodeType,
} from '@epam/ai-dial-ui-kit';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import DeleteFolder from '../../Common/FolderList/Modals/DeleteFolder';
import { ButtonsI18nKey, FileManagerI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ServerActionResponse } from '@/src/models/server-action';
import { Asset, AssetWithVersion } from '@/src/models/dial/deployment-asset';

interface Props {
  view: ApplicationRoute;
  isOpen: boolean;
  itemsToDelete: DialFile[];
  versionsMap: Record<string, string[]>;
  getAssetContext: () => AssetsFolderContext;
  onRemoveAsset: ((entity: string) => Promise<ServerActionResponse>) | null;
  onRemoveFolder: () => void;
  onMultipleRemove: () => void;
  onClose: () => void;
  onRemoveAssetEnd: () => void;
}

const DeleteModal: FC<Props> = ({
  view,
  isOpen,
  itemsToDelete,
  versionsMap,
  getAssetContext,
  onRemoveAsset,
  onRemoveFolder,
  onMultipleRemove,
  onClose,
  onRemoveAssetEnd,
}) => {
  const t = useI18n();

  const filterFolderData = useCallback((items: Asset[]) => {
    return items.filter((item) => item.name && !item.name.startsWith('.'));
  }, []);

  const getMultipleRemoveModalContent = useCallback(() => {
    const assets = itemsToDelete.filter((item) => item.nodeType === DialFileNodeType.ITEM) as AssetWithVersion[];
    const folders = itemsToDelete.filter((item) => item.nodeType === DialFileNodeType.FOLDER);

    const foldersNames = folders?.map((folder) => folder.name) || [];
    const assetNames: string[] = [];
    assets.forEach((asset) => {
      assetNames.push(...(asset?.selectedVersions?.map((v) => `${prompt.name}__${v}`) || []));
    });

    return (
      <div className="px-6 py-3 dial-small">
        {folders.length > 0 && (
          <DialAlert
            className="[&>div]:flex-1 [&>div>div:last-child]:w-full mb-4"
            variant={AlertVariant.Warning}
            message={t(FileManagerI18nKey.DeleteFolderAlert)}
          />
        )}
        <p className="text-secondary mb-3">
          {t(FileManagerI18nKey.DeleteItemsModalDescription, { length: foldersNames.length + assetNames.length })}
        </p>
        {foldersNames.length > 0 && (
          <>
            <p className="text-secondary mb-1">{`${t(FoldersI18nKey.Folders)}:`}</p>
            <ul className="space-y-1 text-primary list-none mb-2 ml-2">
              {foldersNames.slice(0, 10).map((item) => (
                <li key={item} className="truncate">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
        {assetNames.length > 0 && foldersNames.length < 10 && (
          <>
            <p className="text-secondary mb-1">{`${t(FileManagerI18nKey.Items)}:`}</p>
            <ul className="space-y-1 text-primary list-none mb-2 ml-2">
              {assetNames.slice(0, 10 - foldersNames.length).map((item) => (
                <li key={item} className="truncate">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
        {assetNames.length + foldersNames.length > 10 && (
          <p className="text-secondary italic">
            {t(FileManagerI18nKey.MoreItems, { length: assetNames.length + foldersNames.length - 10 })}
          </p>
        )}
      </div>
    );
  }, [itemsToDelete, t]);

  return (
    <>
      {itemsToDelete.length === 1 && itemsToDelete[0].nodeType === DialFileNodeType.ITEM && onRemoveAsset && (
        <DeleteConfirmationModal
          entity={itemsToDelete[0]}
          onRemoveEntity={onRemoveAsset}
          view={view}
          onCloseModal={onClose}
          getAssetContext={getAssetContext}
          existingVersions={versionsMap[itemsToDelete[0].name]}
          onResetEntity={onRemoveAssetEnd}
        />
      )}
      {itemsToDelete.length === 1 && itemsToDelete[0].nodeType === DialFileNodeType.FOLDER && (
        <DeleteFolder
          view={view}
          isModalOpen={isOpen}
          onClose={onClose}
          onApply={onRemoveFolder}
          context={getAssetContext}
          selectedFolder={itemsToDelete[0]?.path || ''}
          filterFolderData={filterFolderData}
        />
      )}
      {itemsToDelete.length > 1 && (
        <DialConfirmationPopup
          header={t(FileManagerI18nKey.DeleteItemsModalTitle)}
          open={isOpen}
          confirmLabel={t(ButtonsI18nKey.Delete)}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          variant={ConfirmationPopupVariant.Danger}
          onClose={onClose}
          onConfirm={onMultipleRemove}
        >
          {getMultipleRemoveModalContent()}
        </DialConfirmationPopup>
      )}
    </>
  );
};

export default DeleteModal;
