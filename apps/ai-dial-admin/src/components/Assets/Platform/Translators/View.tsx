'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeTranslator, updateTranslator } from '@/src/app/[lang]/platform-translators/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useTranslatorsFolder } from '@/src/context/assets/TranslatorsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalTranslator: DialTranslatorResource;
}

const TranslatorAssetView: FC<Props> = ({ etag, originalTranslator }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformTranslators);
  const router = useRouter();
  const { fetchFiles } = useTranslatorsFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedTranslator, setSelectedTranslator] = useState(structuredClone(originalTranslator));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedTranslator(structuredClone(originalTranslator));
  }, [originalTranslator]);

  useEffect(() => {
    if (Object.keys(selectedTranslator).length && originalTranslator) {
      setIsChanged(!isEqualSkippingUndefined(originalTranslator, selectedTranslator));
    }
  }, [selectedTranslator, originalTranslator]);

  const onDiscard = useCallback(() => {
    setSelectedTranslator(structuredClone(originalTranslator));
    setDiscardKey((prev) => prev + 1);
  }, [originalTranslator]);

  const onSave = useCallback(() => {
    getReqRef.current(updateTranslator, selectedTranslator, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformTranslators, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformTranslators, selectedTranslator.name, t),
          ),
        );
        fetchFiles(selectedTranslator.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedTranslator, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformTranslators}
        entity={selectedTranslator}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeTranslator}
        getAssetContext={useTranslatorsFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedTranslator}
            setSelectedEntity={setSelectedTranslator}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent activeTab={activeTab} selectedTranslator={selectedTranslator} onChange={setSelectedTranslator} />
        )}
      </div>
    </div>
  );
};

export default TranslatorAssetView;
