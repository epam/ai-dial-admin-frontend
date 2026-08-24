'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeInterceptor, updateInterceptor } from '@/src/app/[lang]/assets-interceptors/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useInterceptorsFolder } from '@/src/context/assets/InterceptorsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalInterceptor: DialInterceptorResource;
}

const InterceptorAssetView: FC<Props> = ({ etag, originalInterceptor }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsInterceptors);
  const router = useRouter();
  const { fetchFiles } = useInterceptorsFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedInterceptor, setSelectedInterceptor] = useState(structuredClone(originalInterceptor));
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
    setSelectedInterceptor(structuredClone(originalInterceptor));
  }, [originalInterceptor]);

  useEffect(() => {
    if (Object.keys(selectedInterceptor).length && originalInterceptor) {
      setIsChanged(!isEqualSkippingUndefined(originalInterceptor, selectedInterceptor));
    }
  }, [selectedInterceptor, originalInterceptor]);

  const onDiscard = useCallback(() => {
    setSelectedInterceptor(structuredClone(originalInterceptor));
    setDiscardKey((prev) => prev + 1);
  }, [originalInterceptor]);

  const onSave = useCallback(() => {
    getReqRef.current(updateInterceptor, selectedInterceptor, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsInterceptors, t),
            getUpdateNotificationDescription(ApplicationRoute.AssetsInterceptors, selectedInterceptor.name, t),
          ),
        );
        fetchFiles(selectedInterceptor.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedInterceptor, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.AssetsInterceptors}
        entity={selectedInterceptor}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeInterceptor}
        getAssetContext={useInterceptorsFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedInterceptor}
            setSelectedEntity={setSelectedInterceptor}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            activeTab={activeTab}
            selectedInterceptor={selectedInterceptor}
            onChange={setSelectedInterceptor}
          />
        )}
      </div>
    </div>
  );
};

export default InterceptorAssetView;
