'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { removeProjectFile, uploadProjectFile } from '@/src/app/[lang]/projects/actions';
import { PROJECT_MANIFEST_FILE } from '@/src/constants/project';
import { DialProjectFile } from '@/src/models/dial/resource';
import { StoredContextFile } from '@/src/models/project-context';
import { ServerActionResponse } from '@/src/models/server-action';
import {
  buildProjectManifest,
  parseProjectManifest,
  toContextFileName,
  toContextFilePath,
} from '@/src/utils/project-manifest';

interface Params {
  /** `PROJECT.md`'s raw last-fetched content; `undefined` while it is still loading. */
  manifestContent: string | undefined;
  projectName: string;
  files: DialProjectFile[];
}

/**
 * Staged edits to a project — Description, Instructions and Context files — shared by the `Assets > Projects`
 * view and the Project Publications view. Nothing reaches Core until {@link apply} runs on the owning view's
 * Save; {@link discard} reverts everything without contacting Core. `PROJECT.md` is rebuilt from its original
 * content plus the staged fields, so frontmatter keys another client wrote survive a save.
 */
export const useProjectStaging = ({ manifestContent, projectName, files }: Params) => {
  const manifest = useMemo(() => parseProjectManifest(manifestContent ?? ''), [manifestContent]);
  // Only the user's edits are state: the fields are derived from the manifest, so loading or reloading it never
  // looks like a pending change for a render.
  const [descriptionEdit, setDescriptionEdit] = useState<string | undefined>(undefined);
  const [instructionsEdit, setInstructionsEdit] = useState<string | undefined>(undefined);
  const [addedFiles, setAddedFiles] = useState<File[]>([]);
  const [removedFileNames, setRemovedFileNames] = useState<string[]>([]);

  // Keyed on the file names, not the array: a caller may hand over a fresh array with the same files, which must
  // not throw away the edits staged so far.
  const filesKey = files.map((file) => file.name).join('|');

  useEffect(() => {
    setDescriptionEdit(undefined);
    setInstructionsEdit(undefined);
    setAddedFiles([]);
    setRemovedFileNames([]);
  }, [manifest, filesKey]);

  const description = descriptionEdit ?? manifest.description;
  const instructions = instructionsEdit ?? manifest.instructions;

  const storedFiles = useMemo<StoredContextFile[]>(
    () =>
      files.flatMap((file) => {
        const name = toContextFileName(file.name);
        return name ? [{ name, size: file.size }] : [];
      }),
    [files],
  );

  const isManifestChanged = description !== manifest.description || instructions !== manifest.instructions;
  const isChanged = isManifestChanged || addedFiles.length > 0 || removedFileNames.length > 0;

  const onAddFiles = useCallback((incoming: File[]) => {
    setAddedFiles((prev) => [...prev, ...incoming]);
  }, []);

  const onRemoveStoredFile = useCallback((fileName: string) => {
    setRemovedFileNames((prev) => (prev.includes(fileName) ? prev : [...prev, fileName]));
  }, []);

  const onRemoveAddedFile = useCallback((index: number) => {
    setAddedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  }, []);

  const discard = useCallback(() => {
    setDescriptionEdit(undefined);
    setInstructionsEdit(undefined);
    setAddedFiles([]);
    setRemovedFileNames([]);
  }, []);

  /**
   * Writes the staged changes to the project at `path`: the manifest first, then removals (so a name freed by a
   * removal can be reused by an addition in the same save), then additions. Stops at the first failure and
   * returns it, leaving the staged state untouched so nothing is lost.
   */
  const apply = useCallback(
    async (path: string): Promise<ServerActionResponse> => {
      if (isManifestChanged) {
        const content = buildProjectManifest(manifestContent ?? '', { name: projectName, description, instructions });
        const formData = new FormData();
        formData.append('file', new File([content], PROJECT_MANIFEST_FILE, { type: 'text/markdown' }));
        const result = await uploadProjectFile(path, PROJECT_MANIFEST_FILE, formData);
        if (!result.success) {
          return result;
        }
      }
      for (const fileName of removedFileNames) {
        const result = await removeProjectFile(path, toContextFilePath(fileName));
        if (!result.success) {
          return result;
        }
      }
      for (const file of addedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadProjectFile(path, toContextFilePath(file.name), formData);
        if (!result.success) {
          return result;
        }
      }
      return { success: true };
    },
    [addedFiles, description, instructions, isManifestChanged, manifestContent, projectName, removedFileNames],
  );

  return {
    description,
    instructions,
    storedFiles,
    addedFiles,
    removedFileNames,
    isChanged,
    onChangeDescription: setDescriptionEdit,
    onChangeInstructions: setInstructionsEdit,
    onAddFiles,
    onRemoveStoredFile,
    onRemoveAddedFile,
    discard,
    apply,
  };
};
