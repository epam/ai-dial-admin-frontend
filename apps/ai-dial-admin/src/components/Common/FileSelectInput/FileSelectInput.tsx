import { FC, useCallback, useState } from 'react';

import EntitySelectManager from '@/src/components/Common/EntitySelectInput/EntitySelectManager';
import { EntitySelectType } from '@/src/components/Common/EntitySelectInput/models';
import SelectInputPopup from '@/src/components/Common/EntitySelectInput/SelectInputPopup';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { toFileSelectPath } from '@/src/utils/files/path';
import { EntityViewTab, getFileSelectInputTabs } from '@/src/utils/tabs/utils';
import ApplicationFileManager from './ApplicationFileManager';

interface Props {
  value: string;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChangeValue: (value: string) => void;
  view?: ApplicationRoute;
  id?: string;
}

const FileSelectInput: FC<Props> = ({ value, label, elementId, disabled, inputClassName, onChangeValue, view, id }) => {
  const t = useI18n();

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = getFileSelectInputTabs(t);
  const showTabs = !!view && !!id;

  const filePath = toFileSelectPath(value);
  const isPublicFile = !filePath || filePath.includes('public/');
  const [activeTab, setActiveTab] = useState(isPublicFile ? EntityViewTab.Public : EntityViewTab.Application);

  const onConfirm = useCallback(() => {
    onChangeValue(selectedFilePath ?? '');
    setIsModalOpen(false);
  }, [onChangeValue, selectedFilePath]);

  return (
    <FileFolderProvider>
      <SelectInputPopup
        displayValue={filePath}
        header={t(TestSuitesI18nKey.SelectDocument)}
        portalId="fileSelect"
        isOpen={isModalOpen}
        isConfirmDisabled={!selectedFilePath}
        label={label}
        elementId={elementId}
        disabled={disabled}
        inputClassName={inputClassName}
        onOpen={() => setIsModalOpen(true)}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onConfirm}
        onChangeValue={onChangeValue}
      >
        <div className="size-full flex flex-col">
          {showTabs && (
            <div className="flex flex-row justify-between pt-4 px-6 items-center">
              <Tabs tabs={tabs} activeTab={activeTab} onChangeActiveTab={setActiveTab} />
            </div>
          )}
          <div className="grow min-h-0 overflow-hidden">
            {activeTab === EntityViewTab.Public && (
              <EntitySelectManager
                entityType={EntitySelectType.File}
                value={isPublicFile ? filePath : ''}
                isModalOpen={isModalOpen}
                onChangeSelectedPath={setSelectedFilePath}
              />
            )}
            {activeTab === EntityViewTab.Application && (
              <ApplicationFileManager
                id={id}
                view={view}
                value={filePath}
                selectedFilePath={selectedFilePath}
                onChangeSelectedFilePath={setSelectedFilePath}
              />
            )}
          </div>
        </div>
      </SelectInputPopup>
    </FileFolderProvider>
  );
};

export default FileSelectInput;
