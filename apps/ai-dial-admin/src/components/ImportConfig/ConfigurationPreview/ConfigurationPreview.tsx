'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';

import { previewJsonConfigs, previewZipConfig } from '@/src/app/[lang]/import-config/actions';
import Button from '@/src/components/Common/Button/Button';
import Loader from '@/src/components/Common/Loader/Loader';
import { ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ImportFileType } from '@/src/types/import';
import { getErrorNotification } from '@/src/utils/notification';
import { TabModel } from '@/src/models/tab';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { getConfigurationPreview } from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import { FileConfiguration } from '@/src/models/import';
import ConfigurationGrid from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationGrid';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import { DialAdapter } from '@/src/models/dial/adapter';
import { EntityType } from '@/src/types/entity-type';

interface Props {
  importBody: FormData;
  files: File[];
  fileType: ImportFileType;
  onImportFile: () => void;
}

const ConfigurationPreview: FC<Props> = ({ files, importBody, fileType, onImportFile }) => {
  const t = useI18n() as (v: string) => string;
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [data, setData] = useState<Record<string, DialBaseEntity[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [adapters, setAdapters] = useState<DialAdapter[]>([]);

  const getAdapters = async () => {
    const adaptersResponse = await getModelsAdapters();
    if (adaptersResponse.success) {
      setAdapters((adaptersResponse.response as DialAdapter[]) || []);
    } else {
      showNotificationRef.current(getErrorNotification(adaptersResponse.errorHeader, adaptersResponse.errorMessage));
    }
  };

  useEffect(() => {
    setIsLoading(true);
    (fileType == ImportFileType.ARCHIVE ? previewZipConfig(importBody) : previewJsonConfigs(importBody)).then((res) => {
      setIsLoading(false);
      if (res.success) {
        const fileConfiguration = res.response as FileConfiguration;
        const { previewData, tabs } = getConfigurationPreview(fileConfiguration, t);
        getAdapters();

        setData(previewData);
        setTabs(tabs);
        setSelectedTab(tabs[0]?.id);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [fileType, importBody, t]);

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded border border-primary p-6 mt-8">
      <div className="mb-2 flex flex-row justify-between">
        <h1>{t(ImportI18nKey.ImportConfiguration)}</h1>
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Import)}
          disable={isLoading || !files}
          iconBefore={<IconDownload {...BASE_ICON_PROPS} />}
          onClick={onImportFile}
        />
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-col h-full w-full justify-center items-center">
            <Loader size={45} containerClassName="h-auto" />
            <p className="mt-3 text-primary small">{t(ImportI18nKey.ConfigurationParsing)}</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="mb-3">
              <Tabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
            </div>
            <ConfigurationGrid selectedTab={selectedTab as EntityType} tabData={data} adapters={adapters} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPreview;
