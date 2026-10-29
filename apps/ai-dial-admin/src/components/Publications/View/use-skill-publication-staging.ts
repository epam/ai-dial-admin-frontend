'use client';

import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { getSkillManifest, removeSkillFile, uploadSkillFile } from '@/src/app/[lang]/skills/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { ServerActionResponse } from '@/src/models/server-action';
import { getErrorNotification } from '@/src/utils/notification';
import { buildSkillManifest, parseSkillManifest, SkillManifest } from '@/src/utils/skill-manifest';

interface Params {
  /** The skill's path, or `undefined` when the open publication is not a Skill publication. */
  skillPath?: string;
  /** Whether the `Skill` tab is the active one — the manifest is fetched on its first activation. */
  isManifestTabActive: boolean;
}

export interface SkillPublicationStaging {
  addedFiles: File[];
  setAddedFiles: Dispatch<SetStateAction<File[]>>;
  removedFileNames: string[];
  setRemovedFileNames: Dispatch<SetStateAction<string[]>>;
  stagedManifest?: SkillManifest;
  isChanged: boolean;
  onChangeDescription: (description: string) => void;
  onChangeBody: (body: string) => void;
  /** Drops the cached manifest, e.g. when the publication it was read for has been replaced. */
  reset: () => void;
  discard: () => void;
  apply: (skillPath: string) => Promise<ServerActionResponse>;
}

/**
 * Staged Skill edits for a Skill publication — file additions/removals and the `SKILL.md` description/body —
 * written directly against Core's per-file skill routes after `updatePublication` succeeds, since they aren't
 * publication fields. Same shape as `Assets > Skills`' `SkillView`; see `buildSkillManifest` for why the
 * original manifest content is kept alongside the parsed fields. The manifest is fetched lazily on the first
 * activation of the Skill tab, not eagerly with the rest of the page.
 */
export const useSkillPublicationStaging = ({ skillPath, isManifestTabActive }: Params): SkillPublicationStaging => {
  const { showNotification } = useNotification();
  const [addedFiles, setAddedFiles] = useState<File[]>([]);
  const [removedFileNames, setRemovedFileNames] = useState<string[]>([]);
  const [manifestContent, setManifestContent] = useState<string | undefined>(undefined);
  const [manifest, setManifest] = useState<SkillManifest | undefined>(undefined);
  const [stagedManifest, setStagedManifest] = useState<SkillManifest | undefined>(undefined);

  const isManifestChanged =
    !!manifest &&
    !!stagedManifest &&
    (stagedManifest.description !== manifest.description || stagedManifest.body !== manifest.body);

  useEffect(() => {
    if (!isManifestTabActive || manifestContent !== undefined || !skillPath) {
      return;
    }
    getSkillManifest(skillPath).then((result) => {
      if (!result.success) {
        showNotification(getErrorNotification(result.errorHeader, result.errorMessage));
        return;
      }
      const content = result.response as string;
      const parsed = parseSkillManifest(content);
      setManifestContent(content);
      setManifest(parsed);
      setStagedManifest(parsed);
    });
  }, [isManifestTabActive, manifestContent, skillPath, showNotification]);

  const onChangeDescription = useCallback((description: string) => {
    setStagedManifest((prev) => (prev ? { ...prev, description } : prev));
  }, []);

  const onChangeBody = useCallback((body: string) => {
    setStagedManifest((prev) => (prev ? { ...prev, body } : prev));
  }, []);

  const reset = useCallback(() => {
    setManifestContent(undefined);
    setManifest(undefined);
    setStagedManifest(undefined);
  }, []);

  const discard = useCallback(() => {
    setAddedFiles([]);
    setRemovedFileNames([]);
    setStagedManifest(manifest);
  }, [manifest]);

  /**
   * File removals first, so a name freed by a removal can be reused by an added file in the same save; the
   * manifest write doesn't interact with either.
   */
  const apply = useCallback(
    async (path: string): Promise<ServerActionResponse> => {
      if (isManifestChanged && manifestContent && manifest && stagedManifest) {
        const content = buildSkillManifest(manifestContent, {
          name: manifest.name,
          description: stagedManifest.description,
          body: stagedManifest.body,
        });
        const formData = new FormData();
        formData.append('file', new File([content], 'SKILL.md', { type: 'text/markdown' }));
        const result = await uploadSkillFile(path, 'SKILL.md', formData);
        if (!result.success) {
          return result;
        }
        setManifestContent(content);
        setManifest(stagedManifest);
      }
      for (const fileName of removedFileNames) {
        const result = await removeSkillFile(path, fileName);
        if (!result.success) {
          return result;
        }
      }
      for (const file of addedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadSkillFile(path, file.name, formData);
        if (!result.success) {
          return result;
        }
      }
      setAddedFiles([]);
      setRemovedFileNames([]);
      return { success: true };
    },
    [addedFiles, isManifestChanged, manifest, manifestContent, removedFileNames, stagedManifest],
  );

  return {
    addedFiles,
    setAddedFiles,
    removedFileNames,
    setRemovedFileNames,
    stagedManifest,
    isChanged: addedFiles.length > 0 || removedFileNames.length > 0 || isManifestChanged,
    onChangeDescription,
    onChangeBody,
    reset,
    discard,
    apply,
  };
};
