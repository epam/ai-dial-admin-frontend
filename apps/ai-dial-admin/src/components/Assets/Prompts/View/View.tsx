'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { createPrompt, getPrompt, getPrompts, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import { getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import PromptProperties from './Properties';
import { addNewVersion } from './utils';

interface Props {
  originalPrompt: DialPrompt;
  prompts?: DialPrompt[] | null;
}

const PromptView: FC<Props> = ({ originalPrompt, prompts }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [propertiesTabs(t)];
  const router = useRouter();
  const { fetchFiles } = usePromptFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedPrompt, setSelectedPrompt] = useState(cloneDeep(originalPrompt));
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);

  const [key, setKey] = useState(0);
  const [addedVersions, setAddedVersions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPrompt(cloneDeep(originalPrompt));
  }, [originalPrompt]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

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
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedPrompt(cloneDeep(originalPrompt));
    setAddedVersions([]);
  }, [jsonEditorEnabled, originalPrompt, dispatch]);

  const onSave = useCallback(
    (newVersion?: string) => {
      const isNeedToMove = getIsNeedToMove(selectedPrompt, originalPrompt);
      let updatedEntity = getEntityForUpdate(selectedPrompt, originalPrompt);

      if (newVersion) {
        updatedEntity = addNewVersion(updatedEntity as DialPrompt, newVersion);
      }
      createPrompt(updatedEntity as DialPrompt).then((res) => {
        if (res.success) {
          if (isNeedToMove) {
            const responsePrompt = res.response as DialPrompt;
            getPrompts(addTrailingSlash(responsePrompt.folderId)).then((prompts) => {
              const pathsToMove = getListOfPathsToMove(responsePrompt, null, prompts || []);
              const newPath = removeTrailingSlash(selectedPrompt.folderId);
              movePrompts(pathsToMove, newPath).then((r) => {
                if (r.every((response) => response.success)) {
                  router.push(
                    `${ApplicationRoute.Prompts}/${getEntityPath(ApplicationRoute.Prompts, { name: (res.response as DialPrompt).name, path: changePath((res.response as DialPrompt).path, newPath) })}`,
                  );
                  fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
                }
              });
            });
          } else {
            fetchFiles(updatedEntity.folderId);
            router.push(`${ApplicationRoute.Prompts}/${getEntityPath(ApplicationRoute.Prompts, res.response)}`);
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [selectedPrompt, originalPrompt, router, fetchFiles, showNotification],
  );

  const onChangeEntity = useCallback(
    (entity: DialPrompt) => {
      setSelectedPrompt(entity);
    },
    [setSelectedPrompt],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.Prompts}
          entity={selectedPrompt}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={removePrompt}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          existingVersions={prompts?.map((prompt) => prompt.version) || []}
          context={usePromptFolder as () => AssetsFolderContext<DialFile | DialPrompt>}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedPrompt}
            setSelectedEntity={setSelectedPrompt}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <PromptProperties
                prompt={selectedPrompt}
                prompts={prompts || []}
                onChangePrompt={onChangeEntity}
                getPrompt={getPrompt}
                addedVersions={addedVersions}
                setAddedVersions={setAddedVersions}
                setSelectedPrompt={setSelectedPrompt}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PromptView;
