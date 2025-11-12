'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { moveFiles, removeFile } from '@/src/app/[lang]/files/actions';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import { EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';
import { changePath } from '@/src/utils/files/path';
import { addTrailingSlash } from '@/src/utils/url';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import FileProperties from './Properties';

interface Props {
  originalFile: DialFile;
}

const FileView: FC<Props> = ({ originalFile }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [propertiesTabs(t)];
  const router = useRouter();
  const { fetchFiles } = useFileFolder();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedFile, setSelectedFile] = useState(cloneDeep(originalFile));
  const [isChanged, setIsChanged] = useState<boolean>(false);

  useEffect(() => {
    setSelectedFile(cloneDeep(originalFile));
  }, [originalFile]);

  const headerClassName = classNames('flex flex-row min-h-[34px] justify-between');

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalFile, selectedFile));
  }, [selectedFile, originalFile]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    setSelectedFile(cloneDeep(originalFile));
  }, [setSelectedFile, originalFile]);

  const onSave = useCallback(() => {
    moveFiles([originalFile.path], selectedFile.folderId).then((r) => {
      if (r.every((response) => response.success)) {
        router.push(
          getUrnForEntity(ApplicationRoute.Files, {
            name: getNameExtensionFromFile(originalFile.name as string).name,
            path: changePath(originalFile.path, selectedFile.folderId),
          }),
        );
        fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
      }
    });
  }, [originalFile, selectedFile, router, fetchFiles]);

  const onChangeEntity = useCallback(
    (entity: DialFile) => {
      setSelectedFile(entity);
    },
    [setSelectedFile],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <div className="flex-1 min-w-0">
          <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        </div>
        <HeaderButtons
          view={ApplicationRoute.Files}
          entity={selectedFile}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={removeFile}
          hideJsonEditor={true}
          jsonEditorEnabled={false}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {activeTab === EntityViewTab.Properties && <FileProperties file={selectedFile} onChangeFile={onChangeEntity} />}
      </div>
    </div>
  );
};

export default FileView;
