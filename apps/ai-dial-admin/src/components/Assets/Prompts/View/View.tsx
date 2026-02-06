'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import { createPrompt, getPrompts, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import TabsContent from './TabsContent';

interface Props {
  originalPrompt: DialPrompt;
  etag?: string;
  prompts?: DialPrompt[] | null;
}

const PromptView: FC<Props> = ({ originalPrompt, etag, prompts }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.Prompts);
  const router = useRouter();
  const { fetchFiles } = usePromptFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedPrompt, setSelectedPrompt] = useState(cloneDeep(originalPrompt));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const [addedVersions, setAddedVersions] = useState<string[]>([]);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedPrompt(cloneDeep(originalPrompt));
  }, [originalPrompt]);

  useEffect(() => {
    if (Object.keys(selectedPrompt).length && originalPrompt) {
      setIsChanged(!isEqualSkippingUndefined(originalPrompt, selectedPrompt));
    }
  }, [selectedPrompt, originalPrompt]);

  const onDiscard = useCallback(() => {
    setSelectedPrompt(cloneDeep(originalPrompt));
    setAddedVersions([]);
  }, [originalPrompt]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedPrompt, originalPrompt);
      let updatedEntity = getEntityForUpdate(selectedPrompt, originalPrompt);

      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity as DialPrompt, newVersion);
      }
      getReqRef.current(createPrompt, updatedEntity as DialPrompt, etag).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(
              getUpdateNotificationTitle(ApplicationRoute.Prompts, t),
              getUpdateNotificationDescription(ApplicationRoute.Prompts, updatedEntity.name, t),
            ),
          );
          if (isNeedToMove) {
            const responsePrompt = res.response as DialPrompt;
            getPrompts(addTrailingSlash(responsePrompt.folderId)).then((prompts) => {
              const pathsToMove = getListOfPathsToMove(responsePrompt, null, prompts || []);
              const newPath = removeTrailingSlash(selectedPrompt.folderId);
              movePrompts(pathsToMove, newPath).then((r) => {
                if (r.every((response) => response.success)) {
                  router.push(
                    getUrnForEntity(ApplicationRoute.Prompts, {
                      name: (res.response as DialPrompt).name,
                      path: changePath((res.response as DialPrompt).path, newPath),
                    }),
                  );
                  fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
                }
              });
            });
          } else {
            fetchFiles(updatedEntity.folderId);

            router.push(getUrnForEntity(ApplicationRoute.Prompts, res.response));
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [selectedPrompt, originalPrompt, etag, showNotification, t, router, fetchFiles],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <AssetHeader
        view={ApplicationRoute.Prompts}
        entity={selectedPrompt}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        assets={prompts}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removePrompt}
        addedVersions={addedVersions}
        setAddedVersions={setAddedVersions}
        getAssetContext={usePromptFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor entity={selectedPrompt} setSelectedEntity={setSelectedPrompt} setIsChanged={setIsChanged} />
        ) : (
          <TabsContent activeTab={activeTab} onChangePrompt={setSelectedPrompt} selectedPrompt={selectedPrompt} />
        )}
      </div>
    </div>
  );
};

export default PromptView;
