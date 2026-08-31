'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import {
  getSkillManifest,
  moveSkills,
  removeSkill,
  removeSkillFile,
  uploadSkillFile,
} from '@/src/app/[lang]/skills/actions';
import SkillAssetProperties from '@/src/components/Assets/Skills/View/Properties';
import SkillHeader from '@/src/components/EntityHeaderControls/SkillHeader';
import SkillManifestTab from '@/src/components/Assets/Skills/View/SkillManifestTab';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialSkillResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { buildSkillManifest, parseSkillManifest, SkillManifest } from '@/src/utils/skill-manifest';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';

interface Props {
  skill: DialSkillResource;
}

/**
 * `Assets > Skills` detail view. No Audit tab, no Core-sync banner, no JSON editor, no version
 * control (Skill has no version concept exposed at this layer — see `SkillButtonsWrapper`'s doc
 * comment for why it isn't the generic `AssetHeader`). Files, the destination folder, and — on the
 * `Skill` tab — `SKILL.md`'s description and body are all staged locally and only committed to Core
 * on Save, matching every other asset's Save/Discard pattern. The Skill tab's content is fetched
 * lazily on first activation, not eagerly with the rest of the page.
 */
const SkillView: FC<Props> = ({ skill: originalSkill }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useSkillFolder();
  const { showNotification } = useNotification();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const tabs = getTabsForAsset(t, ApplicationRoute.Skills);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedSkill, setSelectedSkill] = useState(structuredClone(originalSkill));
  const [addedFiles, setAddedFiles] = useState<File[]>([]);
  const [removedFileNames, setRemovedFileNames] = useState<string[]>([]);

  // `SKILL.md`'s raw last-fetched content — reassembled with the staged manifest fields on Save
  // (see `buildSkillManifest`'s doc comment for why the original content, not just the parsed
  // fields, is needed to preserve untouched frontmatter keys like `version`).
  const [manifestContent, setManifestContent] = useState<string | undefined>(undefined);
  const [manifest, setManifest] = useState<SkillManifest | undefined>(undefined);
  const [stagedManifest, setStagedManifest] = useState<SkillManifest | undefined>(undefined);

  useEffect(() => {
    setSelectedSkill(structuredClone(originalSkill));
    setAddedFiles([]);
    setRemovedFileNames([]);
    setManifestContent(undefined);
    setManifest(undefined);
    setStagedManifest(undefined);
  }, [originalSkill]);

  // Lazy-fetch `SKILL.md`'s content on first activation of the Skill tab, rather than eagerly with
  // the rest of the page — most skill views never open it.
  useEffect(() => {
    if (activeTab !== EntityViewTab.Skill || manifestContent !== undefined) {
      return;
    }
    getSkillManifest(originalSkill.path).then((result) => {
      if (!result.success) {
        showNotification(getErrorNotification(result.errorHeader || t(ErrorI18nKey.ServerError), result.errorMessage));
        return;
      }
      const content = result.response as string;
      const parsed = parseSkillManifest(content);
      setManifestContent(content);
      setManifest(parsed);
      setStagedManifest(parsed);
    });
  }, [activeTab, manifestContent, originalSkill.path, showNotification, t]);

  const isManifestChanged =
    !!manifest &&
    !!stagedManifest &&
    (stagedManifest.description !== manifest.description || stagedManifest.body !== manifest.body);

  const isNeedToMove = removeTrailingSlash(selectedSkill.folderId) !== removeTrailingSlash(originalSkill.folderId);
  const isChanged = addedFiles.length > 0 || removedFileNames.length > 0 || isNeedToMove || isManifestChanged;

  const onChangeDescription = useCallback((description: string) => {
    setStagedManifest((prev) => (prev ? { ...prev, description } : prev));
  }, []);

  const onChangeBody = useCallback((body: string) => {
    setStagedManifest((prev) => (prev ? { ...prev, body } : prev));
  }, []);

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
    setStagedManifest(manifest);
  }, [originalSkill, manifest]);

  const onSave = useCallback(async () => {
    try {
      if (isManifestChanged && manifestContent && manifest && stagedManifest) {
        const content = buildSkillManifest(manifestContent, {
          name: manifest.name,
          description: stagedManifest.description,
          body: stagedManifest.body,
        });
        const formData = new FormData();
        formData.append('file', new File([content], 'SKILL.md', { type: 'text/markdown' }));
        const result = await uploadSkillFile(originalSkill.path, 'SKILL.md', formData);
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
        setManifestContent(content);
        setManifest(stagedManifest);
      }

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
          getUpdateNotificationTitle(ApplicationRoute.Skills, t),
          getUpdateNotificationDescription(ApplicationRoute.Skills, originalSkill.name, t),
        ),
      );
      setAddedFiles([]);
      setRemovedFileNames([]);

      if (isNeedToMove) {
        // A move invalidates the whole folder tree, not just the destination — the skill's old
        // folder now has one fewer child too. Reset from the root and let the tree lazy-reload,
        // matching `Assets > Toolsets`' own post-move refresh.
        fetchFiles(addTrailingSlash(ROOT_FOLDER), true);
        router.push(getUrnForEntity(ApplicationRoute.Skills, { name: originalSkill.name, path: newPath }));
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
    isManifestChanged,
    manifestContent,
    manifest,
    stagedManifest,
    showNotification,
    t,
    router,
    fetchFiles,
  ]);

  const onRemoveSkill = useCallback(
    (path: string) => removeSkill(path, originalSkill.etag || DEFAULT_ETAG),
    [originalSkill.etag],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SkillHeader
        view={ApplicationRoute.Skills}
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
        {activeTab === EntityViewTab.Properties && (
          <SkillAssetProperties
            skill={selectedSkill}
            onChangeFolderId={onChangeFolderId}
            addedFiles={addedFiles}
            removedFileNames={removedFileNames}
            onAddFile={onAddFile}
            onRemoveExistingFile={onRemoveExistingFile}
            onRemoveAddedFile={onRemoveAddedFile}
          />
        )}
        {activeTab === EntityViewTab.Skill && stagedManifest && (
          <SkillManifestTab
            name={stagedManifest.name}
            description={stagedManifest.description}
            body={stagedManifest.body}
            onChangeDescription={onChangeDescription}
            onChangeBody={onChangeBody}
            disabled={isReadOnlyAdmin}
          />
        )}
      </div>
    </div>
  );
};

export default SkillView;
