'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import { createPrompt, getPrompts, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { addNewVersion, getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import PromptProperties from './Properties';
import { Asset } from '@/src/models/dial/deployment-asset';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';

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
  const { dispatch } = useSaveValidationContext();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedPrompt, setSelectedPrompt] = useState(cloneDeep(originalPrompt));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);

  const [key, setKey] = useState(0);
  const [addedVersions, setAddedVersions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPrompt(cloneDeep(originalPrompt));
  }, [originalPrompt]);

  useEffect(() => {
    if (Object.keys(selectedPrompt).length && originalPrompt) {
      setIsChanged(!isEqualSkippingUndefined(originalPrompt, selectedPrompt));
    }
  }, [selectedPrompt, originalPrompt]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedPrompt(cloneDeep(originalPrompt));
    setAddedVersions([]);
  }, [isJsonEditorEnabled, originalPrompt, dispatch]);

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

  const onChangeEntity = useCallback(
    (entity: DialPrompt) => {
      setSelectedPrompt(entity);
    },
    [setSelectedPrompt],
  );

  const onToggleJsonEditor = useCallback(() => {
    setIsJsonEditorEnabled((prev) => !prev);
  }, [setIsJsonEditorEnabled]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        <Tabs
          tabs={tabs}
          isEditorEnabled={isJsonEditorEnabled}
          activeTab={activeTab}
          onChangeActiveTab={onChangeActiveTab}
        />

        <HeaderButtons
          view={ApplicationRoute.Prompts}
          entity={selectedPrompt}
          onChangeEntity={onChangeEntity}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          onRemove={removePrompt}
          isEditorEnabled={isJsonEditorEnabled}
          onToggleEditor={onToggleJsonEditor}
          assets={prompts as Asset[]}
          addedVersions={addedVersions}
          setAddedVersions={setAddedVersions}
          getAssetContext={usePromptFolder as () => AssetsFolderContext<DialFile | DialPrompt>}
        />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedPrompt}
            setSelectedEntity={setSelectedPrompt}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <PromptProperties prompt={selectedPrompt} onChangePrompt={onChangeEntity} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PromptView;
