import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { previewExportConfig } from '@/src/app/[lang]/export-config/actions';
import Button from '@/src/components/Common/Button/Button';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import Switch from '@/src/components/Common/Switch/Switch';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import ConfigContentGrid from '@/src/components/ExportConfig/Content/ConfigContentGrid';
import { getPreviewTabs } from '@/src/components/ExportConfig/Preview/PreviewModal.utils';
import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportRequest } from '@/src/models/export';
import { TabModel } from '@/src/models/tab';
import { ExportType } from '@/src/types/export';
import { PopUpState } from '@/src/types/pop-up';
import { getErrorNotification } from '@/src/utils/notification';
import { EntityType } from '@/src/types/entity-type';

interface Props {
  exportRequest: Partial<ExportRequest>;
  modalState: PopUpState;
  onClose: () => void;
  onPrepare: (isIncludeSecret: boolean) => void;
}

const PreviewModal: FC<Props> = ({ exportRequest, onPrepare, modalState, onClose }) => {
  const t = useI18n() as (v: string) => string;

  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [isIncludeSecret, setIsIncludeSecret] = useState<boolean>(false);
  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [data, setData] = useState<Record<string, EntitiesGridData[]>>({});
  const [selectedTab, setSelectedTab] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const toggleIncludeSecret = useCallback(() => {
    setIsIncludeSecret((prev) => !prev);
  }, [setIsIncludeSecret]);

  useEffect(() => {
    if (exportRequest.$type === ExportType.Custom && exportRequest.components?.length === 0) {
      return;
    }

    setIsLoadingData(true);
    previewExportConfig({
      ...exportRequest,
      addSecrets: isIncludeSecret,
    } as ExportRequest).then((res) => {
      setIsLoadingData(false);
      if (res.success) {
        const data = res.response as Record<string, EntitiesGridData[]>;
        const { convertedData, tabs } = getPreviewTabs(data, t);

        setData(convertedData);
        setTabs(tabs);
        setSelectedTab(tabs[0]?.id);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [exportRequest, isIncludeSecret, showNotification, t]);

  return (
    <Popup
      onClose={onClose}
      heading={t(ExportI18nKey.ExportFilePreview)}
      portalId="ExportFilePreview"
      state={modalState}
      containerClassName="h-[800px] lg:max-w-[75%] md:max-w-[90%]"
    >
      <div className="flex flex-col gap-4 py-6 px-6 h-[674px]">
        <div className="flex-1 min-h-0">
          {isLoadingData ? (
            <Loader size={50} />
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <Tabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
              </div>
              <div className="flex-1 min-h-0">
                <ConfigContentGrid selectedTab={selectedTab as EntityType} tabData={data} isFull={true} />
              </div>
            </div>
          )}
        </div>
        <Switch
          isOn={isIncludeSecret}
          title={t(ExportI18nKey.IncludeSecrets)}
          switchId="includeSecret"
          onChange={toggleIncludeSecret}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button
          dataTestId="previewClose"
          cssClass="secondary"
          title={t(ButtonsI18nKey.Cancel)}
          onClick={() => onClose()}
        />
        <Button
          dataTestId="settingsConfirm"
          cssClass="primary"
          title={t(ButtonsI18nKey.Export)}
          onClick={() => onPrepare(isIncludeSecret)}
        />
      </div>
    </Popup>
  );
};

export default PreviewModal;
