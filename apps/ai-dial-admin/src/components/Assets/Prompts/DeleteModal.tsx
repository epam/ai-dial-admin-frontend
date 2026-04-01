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
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { ServerActionResponse } from '@/src/models/server-action';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Asset } from '@/src/models/dial/deployment-asset';

interface Props {
  isOpen: boolean;
  itemsToDelete: DialFile[];
  versionsMap: Record<string, string[]>;
  getAssetContext: () => AssetsFolderContext;
  onRemovePrompt: (entity: string) => Promise<ServerActionResponse>;
  onRemoveFolder: () => void;
  onMultipleRemove: () => void;
  onClose: () => void;
  resetFolder: () => void;
}

const DeleteModal: FC<Props> = ({
  isOpen,
  itemsToDelete,
  versionsMap,
  getAssetContext,
  onRemovePrompt,
  onRemoveFolder,
  onMultipleRemove,
  onClose,
  resetFolder,
}) => {
  const t = useI18n();

  const filterFolderData = useCallback((items: Asset[]) => {
    return items.filter((item) => item.name && !item.name.startsWith('.'));
  }, []);

  const getMultipleRemoveModalContent = useCallback(() => {
    const prompts = itemsToDelete.filter((item) => item.nodeType === DialFileNodeType.ITEM) as DialPrompt[];
    const folders = itemsToDelete.filter((item) => item.nodeType === DialFileNodeType.FOLDER);

    const foldersNames = folders?.map((folder) => folder.name) || [];
    const promptsNames: string[] = [];
    prompts.forEach((prompt) => {
      promptsNames.push(...(prompt?.selectedVersions?.map((v) => `${prompt.name}__${v}`) || []));
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
          {t(FileManagerI18nKey.DeleteItemsModalDescription, { length: foldersNames.length + promptsNames.length })}
        </p>
        {foldersNames.length > 0 && (
          <>
            <p className="text-secondary mb-1">Folders:</p>
            <ul className="space-y-1 text-primary list-none mb-2 ml-2">
              {foldersNames.slice(0, 10).map((item) => (
                <li key={item} className="truncate">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
        {promptsNames.length > 0 && foldersNames.length < 10 && (
          <>
            <p className="text-secondary mb-1">Prompts:</p>
            <ul className="space-y-1 text-primary list-none mb-2 ml-2">
              {promptsNames.slice(0, 10 - foldersNames.length).map((item) => (
                <li key={item} className="truncate">
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}
        {promptsNames.length + foldersNames.length > 10 && (
          <p className="text-secondary italic">
            {t(FileManagerI18nKey.MoreItems, { length: promptsNames.length + foldersNames.length - 10 })}
          </p>
        )}
      </div>
    );
  }, [itemsToDelete, t]);

  return (
    <>
      {itemsToDelete.length === 1 && itemsToDelete[0].nodeType === DialFileNodeType.ITEM && (
        <DeleteConfirmationModal
          entity={itemsToDelete[0]}
          onRemoveEntity={onRemovePrompt}
          view={ApplicationRoute.Prompts}
          onCloseModal={onClose}
          getAssetContext={getAssetContext}
          existingVersions={versionsMap[itemsToDelete[0].name]}
          onResetEntity={resetFolder}
        />
      )}
      {itemsToDelete.length === 1 && itemsToDelete[0].nodeType === DialFileNodeType.FOLDER && (
        <DeleteFolder
          view={ApplicationRoute.Prompts}
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
