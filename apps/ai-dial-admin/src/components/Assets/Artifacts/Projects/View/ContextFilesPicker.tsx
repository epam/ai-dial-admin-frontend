'use client';

import { FC, useCallback, useState } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import EntitySelectManager from '@/src/components/Common/EntitySelectInput/EntitySelectManager';
import { EntitySelectType } from '@/src/components/Common/EntitySelectInput/models';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ApiRoute } from '@/src/constants/api-routes';
import { ButtonsI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Receives copies of the picked files, to be validated and staged like any file added from the device. */
  onPick: (files: File[]) => void;
}

/** Downloads one stored file (`<bucket>/<path>`) into a `File` the context section can stage like an upload. */
const downloadStoredFile = async (path: string): Promise<File> => {
  const response = await fetch(`${ApiRoute.FilesDownload}?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  return new File([blob], getFolderNameAndPath(path).name, { type: blob.type });
};

/**
 * "From file storage" for the Context section: a popup over the same file browser the document picker uses, with
 * multi-selection. A project's context is made of copies — the bytes are fetched here and staged like an upload,
 * so the stored files stay where they are and the same limits apply as for a file added from the device.
 */
const ContextFilesPicker: FC<Props> = ({ isOpen, onClose, onPick }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isPicking, setIsPicking] = useState(false);

  const onCancel = useCallback(() => {
    // A cancelled pick must not survive into the next open: the browser would not show it as selected.
    setSelectedPaths([]);
    onClose();
  }, [onClose]);

  const onConfirm = useCallback(async () => {
    setIsPicking(true);
    try {
      const files = await Promise.all(selectedPaths.map(downloadStoredFile));
      setSelectedPaths([]);
      onPick(files);
      onClose();
    } catch {
      showNotification(getErrorNotification(t(ProjectI18nKey.PickFilesError)));
    } finally {
      setIsPicking(false);
    }
  }, [onClose, onPick, selectedPaths, showNotification, t]);

  return (
    // Own provider so the popup's folder state is isolated from the Files page.
    <FileFolderProvider>
      <Popup
        header={t(ProjectI18nKey.SelectFiles)}
        portalId="projectContextFilesSelect"
        open={isOpen}
        onClose={onCancel}
        className="md:h-[800px]"
        size={PopupSize.Lg}
        mainButtons={getFormPopupButtons({
          cancelLabel: t(ButtonsI18nKey.Cancel),
          submitLabel: t(ButtonsI18nKey.Confirm),
          isSubmitDisabled: selectedPaths.length === 0 || isPicking,
          onCancel,
          onSubmit: () => void onConfirm(),
        })}
      >
        <div className="size-full min-h-0 overflow-hidden">
          <EntitySelectManager
            entityType={EntitySelectType.File}
            value=""
            isModalOpen={isOpen}
            onChangeSelectedPaths={setSelectedPaths}
          />
        </div>
      </Popup>
    </FileFolderProvider>
  );
};

export default ContextFilesPicker;
