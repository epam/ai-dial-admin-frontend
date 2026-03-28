import { FC, useCallback, useState } from 'react';

import { DialFormPopup, DialInputPopup, DialLabel, PopupSize } from '@epam/ai-dial-ui-kit';

import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import { BasicI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getFileSelectInputTabs } from '@/src/utils/tabs/utils';
import ApplicationFileManager from './ApplicationFileManager';
import PublicFileManager from './PublicFileManager';

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
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = getFileSelectInputTabs(t);
  const showTabs = !!view && !!id;
  const [activeTab, setActiveTab] = useState(
    !value || value.includes('public/') ? EntityViewTab.Public : EntityViewTab.Application,
  );

  const onConfirm = useCallback(() => {
    onChangeValue(selectedFilePath ?? '');
    setIsModalOpen(false);
  }, [onChangeValue, selectedFilePath]);

  return (
    <div className="flex flex-col gap-y-2">
      {label && <DialLabel label={label} htmlFor={elementId} />}
      <DialInputPopup
        disabled={disabled || isReadOnlyAdmin}
        open={isModalOpen}
        selectedValue={value}
        onOpen={() => setIsModalOpen(true)}
        emptyValueText={t(BasicI18nKey.None)}
        inputClassName={inputClassName}
      >
        <DialFormPopup
          header={t(TestSuitesI18nKey.SelectDocument)}
          portalId="fileSelect"
          open={isModalOpen}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          submitLabel={t(ButtonsI18nKey.Confirm)}
          onSubmit={onConfirm}
          disableSubmitButton={!selectedFilePath}
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          className="h-[800px]"
          size={PopupSize.Lg}
        >
          <div className="size-full flex flex-col gap-2">
            {showTabs && (
              <div className="flex flex-row justify-between py-4 px-6 items-center">
                <Tabs tabs={tabs} activeTab={activeTab} onChangeActiveTab={setActiveTab} />
              </div>
            )}
            {activeTab === EntityViewTab.Public && (
              <PublicFileManager
                value={value}
                isModalOpen={isModalOpen}
                onChangeSelectedFilePath={setSelectedFilePath}
              />
            )}
            {activeTab === EntityViewTab.Application && (
              <ApplicationFileManager
                id={id}
                value={value}
                selectedFilePath={selectedFilePath}
                onChangeSelectedFilePath={setSelectedFilePath}
              />
            )}
          </div>
        </DialFormPopup>
      </DialInputPopup>
    </div>
  );
};

export default FileSelectInput;
