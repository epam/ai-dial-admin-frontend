'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialPrimaryButton, DialLoader, DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { IconDownload } from '@tabler/icons-react';

import { previewJsonConfigs, previewZipConfig } from '@/src/app/[lang]/import-config/actions';
import ConfigurationGrid from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationGrid';
import { getConfigurationPreview } from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import { ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FileConfiguration } from '@/src/models/import';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';
import { ImportFileType } from '@/src/types/import';
import { getErrorNotification } from '@/src/utils/notification';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  importBody: FormData;
  files: File[];
  fileType: ImportFileType;
  onImportFile: () => void;
}

const ConfigurationPreview: FC<Props> = ({ files, importBody, fileType, onImportFile }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const getReqRef = useRef(useProtectedRequest());

  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [data, setData] = useState<Record<string, BaseEntity[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [currentState, setCurrentState] = useState<Record<string, ActivityAuditEntity[]>>({});
  const [prevState, setPrevState] = useState<Record<string, ActivityAuditEntity[]>>({});

  useEffect(() => {
    setIsLoading(true);
    (fileType == ImportFileType.ARCHIVE
      ? getReqRef.current(previewZipConfig, importBody)
      : getReqRef.current(previewJsonConfigs, importBody)
    ).then((res) => {
      setIsLoading(false);
      if (res.success) {
        const fileConfiguration = res.response as FileConfiguration;
        const { previewData, prevData, tabs } = getConfigurationPreview(fileConfiguration, t);

        setCurrentState(previewData as Record<string, ActivityAuditEntity[]>);
        setPrevState(prevData as Record<string, ActivityAuditEntity[]>);
        setData(previewData);
        setTabs(tabs);
        setSelectedTab(tabs[0]?.id);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [fileType, importBody, t]);

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded border border-primary py-4 px-6 mt-8">
      <div className="mb-2 flex flex-row justify-between">
        <h1>{t(ImportI18nKey.Configuration)}</h1>
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Import)}
          disabled={isLoading || !files}
          iconBefore={<IconDownload {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onImportFile}
        />
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-col size-full justify-center items-center">
            <DialLoader size={45} className="h-auto" />
            <p className="mt-3 text-primary small">{t(ImportI18nKey.ConfigurationParsing)}</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="mb-3">
              <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
            </div>
            <ConfigurationGrid
              selectedTab={selectedTab as EntityType}
              tabData={data}
              currentState={currentState}
              prevState={prevState}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPreview;
