'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { cloneDeep } from 'lodash';

import { moveFiles, removeFile } from '@/src/app/[lang]/files/actions';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { changePath } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import FileProperties from './Properties';

interface Props {
  originalFile: DialFile;
}

const FileView: FC<Props> = ({ originalFile }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.Files);
  const router = useRouter();
  const { fetchFiles } = useFileFolder();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedFile, setSelectedFile] = useState(cloneDeep(originalFile));
  const [isChanged, setIsChanged] = useState(false);

  const { showNotification } = useNotification();

  useEffect(() => {
    setSelectedFile(cloneDeep(originalFile));
  }, [originalFile]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalFile, selectedFile));
  }, [selectedFile, originalFile]);

  const onDiscard = useCallback(() => {
    setSelectedFile(cloneDeep(originalFile));
  }, [setSelectedFile, originalFile]);

  const onSave = useCallback(() => {
    moveFiles([originalFile.path], selectedFile.folderId).then((r) => {
      if (r.every((response) => response.success)) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Files, t),
            getUpdateNotificationDescription(ApplicationRoute.Files, originalFile.name, t),
          ),
        );
        router.push(
          getUrnForEntity(ApplicationRoute.Files, {
            name: getNameExtensionFromFile(originalFile.name as string).name,
            path: changePath(originalFile.path, selectedFile.folderId),
          }),
        );
        fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
      } else {
        const error = r.find((r) => !r.success);
        showNotification(getErrorNotification(error?.errorHeader, error?.errorMessage, error?.requestId));
      }
    });
  }, [originalFile.path, originalFile.name, selectedFile.folderId, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Files}
        entity={selectedFile}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeFile}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent entity={selectedFile} view={ApplicationRoute.Files} id={selectedFile.name}>
            <FileProperties file={selectedFile} onChangeFile={setSelectedFile} />
          </PropertiesTabContent>
        )}
      </div>
    </div>
  );
};

export default FileView;
