'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { getToolsets, moveToolsets, removeToolset, updateToolset } from '@/src/app/[lang]/assets-toolsets/actions';
import { getEntityForUpdate, getIsNeedToMove } from '@/src/components/Assets/utils';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { EntityViewTab, propertiesTabs, rolesTabs, toolsTabs } from '@/src/components/EntityView/View/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { AssetToolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import { addTrailingSlash, changePath, getListOfPathsToMove, removeTrailingSlash } from '@/src/utils/files/path';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import ToolsetProperties from '@/src/components/Toolsets/View/Properties';

interface Props {
  etag: string;
  originalToolset: AssetToolset;
  toolsets: AssetToolset[];
}

const ToolsetView: FC<Props> = ({ etag, originalToolset, toolsets }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const tabs = [propertiesTabs(t), toolsTabs(t), rolesTabs(t)];
  const router = useRouter();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);

  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    if (Object.keys(selectedToolset).length && originalToolset) {
      setIsChanged(!isEqualSkippingUndefined(originalToolset, selectedToolset));
    }
  }, [selectedToolset, originalToolset]);

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
    setSelectedToolset(cloneDeep(originalToolset));
  }, [jsonEditorEnabled, originalToolset, dispatch]);

  const onSave = useCallback(() => {
    const isNeedToMove = getIsNeedToMove(selectedToolset, originalToolset);
    const updatedEntity = getEntityForUpdate(selectedToolset, originalToolset);
    updateToolset(updatedEntity, etag).then((res) => {
      if (res.success) {
        if (isNeedToMove) {
          getToolsets(addTrailingSlash(updatedEntity.folderId)).then((toolsets) => {
            const pathsToMove = getListOfPathsToMove(updatedEntity, null, toolsets || []);
            const newPath = removeTrailingSlash(selectedToolset.folderId);
            moveToolsets(pathsToMove, newPath).then((r) => {
              if (r.every((response) => response.success)) {
                router.push(
                  `${ApplicationRoute.AssetsToolsets}/${getEntityPath(ApplicationRoute.AssetsToolsets, { name: updatedEntity.name, path: changePath(updatedEntity.path, newPath) })}`,
                );
                fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
              }
            });
          });
        } else {
          fetchFiles(updatedEntity.folderId);
          router.push(
            `${ApplicationRoute.AssetsToolsets}/${getEntityPath(ApplicationRoute.AssetsToolsets, updatedEntity)}`,
          );
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedToolset, originalToolset, router, fetchFiles, etag, showNotification]);

  const onChangeEntity = useCallback(
    (entity: Toolset) => {
      setSelectedToolset(entity);
    },
    [setSelectedToolset],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onRemove = useCallback(
    (entity: string) => {
      return removeToolset(entity, etag);
    },
    [etag],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.AssetsToolsets}
          entity={selectedToolset}
          isChanged={isChanged}
          onSave={onSave}
          onDiscard={onDiscard}
          removeEntity={onRemove}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          existingVersions={toolsets?.map((app) => app.version) || []}
          context={useToolsetFolder as () => AssetsFolderContext<DialFile | AssetToolset>}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedToolset}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          activeTab === EntityViewTab.Properties && (
            <ToolsetProperties names={[]} selectedToolset={selectedToolset} onChangeToolset={onChangeEntity} />
          )
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
