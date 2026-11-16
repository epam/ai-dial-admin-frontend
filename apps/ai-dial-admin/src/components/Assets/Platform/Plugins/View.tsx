'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removePlugin, updatePlugin } from '@/src/app/[lang]/platform-plugins/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useAppContext } from '@/src/context/AppContext';
import { usePluginsFolder } from '@/src/context/assets/PluginsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialPluginResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { ENTITY_VIEW_CLASS_NAME, ENTITY_VIEW_SCROLL_CLASS_NAME } from '@/src/constants/main-layout';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalPlugin: DialPluginResource;
  isConfigFileSource?: boolean;
}

const PluginAssetView: FC<Props> = ({ etag, originalPlugin, isConfigFileSource }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformPlugins);
  const router = useRouter();
  const { fetchFiles } = usePluginsFolder();
  const { showNotification } = useNotification();
  const { setEntityReadOnly } = useAppContext();
  const getReqRef = useRef(useProtectedRequest());

  useEffect(() => {
    setEntityReadOnly(!!isConfigFileSource);
    return () => setEntityReadOnly(false);
  }, [isConfigFileSource, setEntityReadOnly]);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedPlugin, setSelectedPlugin] = useState(structuredClone(originalPlugin));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      onHideFormatSelector: () => !!isConfigFileSource,
    }),
    [isEditorEnabled, isConfigFileSource],
  );

  useEffect(() => {
    setSelectedPlugin(structuredClone(originalPlugin));
  }, [originalPlugin]);

  useEffect(() => {
    if (Object.keys(selectedPlugin).length && originalPlugin) {
      setIsChanged(!isEqualSkippingUndefined(originalPlugin, selectedPlugin));
    }
  }, [selectedPlugin, originalPlugin]);

  const onDiscard = useCallback(() => {
    setSelectedPlugin(structuredClone(originalPlugin));
    setDiscardKey((prev) => prev + 1);
  }, [originalPlugin]);

  const onSave = useCallback(() => {
    getReqRef.current(updatePlugin, selectedPlugin, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformPlugins, t),
            getUpdateNotificationDescription(
              ApplicationRoute.PlatformPlugins,
              selectedPlugin.name ?? selectedPlugin._metadata?.name,
              t,
            ),
          ),
        );
        fetchFiles(selectedPlugin._metadata?.folderId ?? '');
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedPlugin, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className={ENTITY_VIEW_CLASS_NAME}>
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformPlugins}
        entity={selectedPlugin}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removePlugin}
        getAssetContext={usePluginsFolder}
      />

      <div className={ENTITY_VIEW_SCROLL_CLASS_NAME}>
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedPlugin}
            setSelectedEntity={setSelectedPlugin}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent activeTab={activeTab} selectedPlugin={selectedPlugin} onChange={setSelectedPlugin} />
        )}
      </div>
    </div>
  );
};

export default PluginAssetView;
