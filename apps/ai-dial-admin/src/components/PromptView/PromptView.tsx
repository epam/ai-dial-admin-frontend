'use client';

import classNames from 'classnames';
import { cloneDeep, isEqual } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { createPrompt, getPrompt, getPrompts, movePrompts, removePrompt } from '@/src/app/[lang]/prompts/actions';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import { EntityViewTab, propertiesTabs } from '@/src/components/EntityView/entity-view';
import EntityViewHeaderButtons from '@/src/components/EntityView/EntityViewHeaderButtons';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import PromptProperties from '@/src/components/PromptView/PromptProperties';
import { getEntityForUpdate, getIsNeedToMove } from '@/src/components/PromptView/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { addTrailingSlash, getListOfPathsToMove, changePath, removeTrailingSlash } from '@/src/utils/files/path';

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

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedPrompt, setSelectedPrompt] = useState(cloneDeep(originalPrompt));
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
  const [contentJsonErrors, setContentJsonErrors] = useState<JSONEditorError[]>([]);

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
    setIsChanged(!isEqual(originalPrompt, selectedPrompt));
  }, [selectedPrompt, originalPrompt]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      setJsonErrors([]);
      setIsChanged(false);
      // TODO: Revisit solution
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedPrompt(cloneDeep(originalPrompt));
    setAddedVersions([]);
  }, [setSelectedPrompt, originalPrompt, jsonEditorEnabled]);

  const onSave = useCallback(() => {
    const isNeedToMove = getIsNeedToMove(selectedPrompt, originalPrompt);
    const updatedEntity = getEntityForUpdate(selectedPrompt, originalPrompt);

    createPrompt(updatedEntity).then((res) => {
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
          router.push(`${ApplicationRoute.Prompts}/${getEntityPath(ApplicationRoute.Prompts, res.response)}`);
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [showNotification, originalPrompt, selectedPrompt, router, fetchFiles]);

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
        <EntityViewHeaderButtons
          view={ApplicationRoute.Prompts}
          entity={selectedPrompt}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={removePrompt}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          jsonErrors={jsonErrors}
          contentJsonErrors={contentJsonErrors}
          setErrorNotifications={setErrorNotifications}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <JSONEditor
            key={key}
            model={selectedPrompt}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedPrompt}
            setIsChanged={setIsChanged}
            setJsonErrors={setJsonErrors}
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
                setContentJsonErrors={setContentJsonErrors}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PromptView;
