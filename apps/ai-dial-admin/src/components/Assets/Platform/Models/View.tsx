'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeModel, updateModel } from '@/src/app/[lang]/platform-models/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useModelsFolder } from '@/src/context/assets/ModelsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalModel: AssetModel;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  globalInterceptors?: string[];
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

const ModelView: FC<Props> = ({ etag, originalModel, roles, interceptors, globalInterceptors, optionWarnings }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformModels);
  const router = useRouter();
  const { fetchFiles } = useModelsFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedModel, setSelectedModel] = useState(structuredClone(originalModel));
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
    setSelectedModel(structuredClone(originalModel));
  }, [originalModel]);

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing interceptor reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  useEffect(() => {
    if (Object.keys(selectedModel).length && originalModel) {
      setIsChanged(!isEqualSkippingUndefined(originalModel, selectedModel));
    }
  }, [selectedModel, originalModel]);

  const onDiscard = useCallback(() => {
    setSelectedModel(structuredClone(originalModel));
    setDiscardKey((prev) => prev + 1);
  }, [originalModel]);

  const onSave = useCallback(() => {
    getReqRef.current(updateModel, selectedModel, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformModels, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformModels, selectedModel.name, t),
          ),
        );
        fetchFiles(selectedModel.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedModel, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformModels}
        entity={selectedModel}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeModel}
        getAssetContext={useModelsFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedModel}
            setSelectedEntity={setSelectedModel}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            selectedModel={selectedModel}
            originalModel={originalModel}
            roles={roles}
            interceptors={interceptors}
            globalInterceptors={globalInterceptors}
            onChange={setSelectedModel}
          />
        )}
      </div>
    </div>
  );
};

export default ModelView;
