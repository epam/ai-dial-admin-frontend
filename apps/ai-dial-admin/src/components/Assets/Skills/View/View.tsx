'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { moveSkills, removeSkill, removeSkillFile, uploadSkillFile } from '@/src/app/[lang]/assets-skills/actions';
import SkillAssetProperties from '@/src/components/Assets/Skills/View/Properties';
import SkillHeader from '@/src/components/EntityHeaderControls/SkillHeader';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialSkillResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';

interface Props {
  skill: DialSkillResource;
}

/**
 * `Assets > Skills` detail view. No Audit tab, no Core-sync banner, no JSON editor, no version
 * control (Skill has no version concept exposed at this layer — see `SkillButtonsWrapper`'s doc
 * comment for why it isn't the generic `AssetHeader`). Files and the destination folder are staged
 * locally and only committed to Core on Save, matching every other asset's Save/Discard pattern.
 */
const SkillView: FC<Props> = ({ skill: originalSkill }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useSkillFolder();
  const { showNotification } = useNotification();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsSkills);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedSkill, setSelectedSkill] = useState(structuredClone(originalSkill));
  const [addedFiles, setAddedFiles] = useState<File[]>([]);
  const [removedFileNames, setRemovedFileNames] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSkill(structuredClone(originalSkill));
    setAddedFiles([]);
    setRemovedFileNames([]);
  }, [originalSkill]);

  const isNeedToMove = removeTrailingSlash(selectedSkill.folderId) !== removeTrailingSlash(originalSkill.folderId);
  const isChanged = addedFiles.length > 0 || removedFileNames.length > 0 || isNeedToMove;

  const onChangeFolderId = useCallback((folderId: string) => {
    setSelectedSkill((prev) => ({ ...prev, folderId }));
  }, []);

  const onAddFile = useCallback((file: File) => {
    setAddedFiles((prev) => [...prev, file]);
  }, []);

  const onRemoveExistingFile = useCallback((fileName: string) => {
    setRemovedFileNames((prev) => (prev.includes(fileName) ? prev : [...prev, fileName]));
  }, []);

  const onRemoveAddedFile = useCallback((index: number) => {
    setAddedFiles((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const onDiscard = useCallback(() => {
    setSelectedSkill(structuredClone(originalSkill));
    setAddedFiles([]);
    setRemovedFileNames([]);
  }, [originalSkill]);

  const onSave = useCallback(async () => {
    try {
      for (const fileName of removedFileNames) {
        // No etag: Core's per-file delete is unconditional (see `deleteSkillFile`'s doc comment),
        // and reusing `originalSkill.etag` across a loop would send the same, increasingly stale
        // aggregate etag to every delete after the bundle's first mutation, failing with 412.
        const result = await removeSkillFile(originalSkill.path, fileName);
        if (!result.success) {
          showNotification(
            getErrorNotification(
              result.errorHeader || t(ErrorI18nKey.ServerError),
              result.errorMessage,
              result.requestId,
            ),
          );
          return;
        }
      }
      for (const file of addedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadSkillFile(originalSkill.path, file.name, formData);

        if (!result.success) {
          showNotification(
            getErrorNotification(
              result.errorHeader || t(ErrorI18nKey.ServerError),
              result.errorMessage,
              result.requestId,
            ),
          );
          return;
        }
      }

      let newPath = originalSkill.path;
      if (isNeedToMove) {
        const newFolderId = removeTrailingSlash(selectedSkill.folderId);
        const [moveResult] = await moveSkills([originalSkill.path], newFolderId);

        if (!moveResult?.success) {
          // `moveResult?.errorHeader`/`errorMessage` fall back to a generic message rather than
          // rendering a blank toast when Core's response carries neither — a silent-looking failure
          // is otherwise indistinguishable from the Save button doing nothing at all.
          showNotification(
            getErrorNotification(
              moveResult?.errorHeader || t(ErrorI18nKey.ServerError),
              moveResult?.errorMessage,
              moveResult?.requestId,
            ),
          );
          return;
        }
        newPath = `${newFolderId}/${originalSkill.name}`;
      }

      showNotification(
        getSuccessNotification(
          getUpdateNotificationTitle(ApplicationRoute.AssetsSkills, t),
          getUpdateNotificationDescription(ApplicationRoute.AssetsSkills, originalSkill.name, t),
        ),
      );
      setAddedFiles([]);
      setRemovedFileNames([]);

      if (isNeedToMove) {
        // A move invalidates the whole folder tree, not just the destination — the skill's old
        // folder now has one fewer child too. Reset from the root and let the tree lazy-reload,
        // matching `Assets > Toolsets`' own post-move refresh.
        fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
        router.push(getUrnForEntity(ApplicationRoute.AssetsSkills, { name: originalSkill.name, path: newPath }));
      } else {
        fetchFiles(originalSkill.folderId);
      }
      router.refresh();
    } catch (e) {
      // Any of the above server actions rejecting (rather than resolving `{ success: false }`) would
      // otherwise surface as a silent no-op — no notification, no console output — indistinguishable
      // from the Save button doing nothing at all.
      console.error('Failed to save skill changes', e);
      showNotification(getErrorNotification(t(ErrorI18nKey.ServerError)));
    }
  }, [
    originalSkill,
    selectedSkill,
    addedFiles,
    removedFileNames,
    isNeedToMove,
    showNotification,
    t,
    router,
    fetchFiles,
  ]);

  const onRemoveSkill = useCallback(
    (path: string) => removeSkill(path, originalSkill.etag as string),
    [originalSkill.etag],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SkillHeader
        view={ApplicationRoute.AssetsSkills}
        entity={selectedSkill}
        etag={originalSkill.etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={onRemoveSkill}
        getAssetContext={useSkillFolder}
      />
      <div className="flex-1 overflow-auto min-h-0">
        <SkillAssetProperties
          skill={selectedSkill}
          onChangeFolderId={onChangeFolderId}
          addedFiles={addedFiles}
          removedFileNames={removedFileNames}
          onAddFile={onAddFile}
          onRemoveExistingFile={onRemoveExistingFile}
          onRemoveAddedFile={onRemoveAddedFile}
        />
      </div>
    </div>
  );
};

export default SkillView;
