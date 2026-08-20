import { ColDef, GridApi, IRowNode } from 'ag-grid-community';
import { ChangeEvent, FC, useCallback, useMemo, useRef } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ApiRoute } from '@/src/constants/api-routes';
import { getDownloadOperation, getPreviewOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialSkillFile, DialSkillResource } from '@/src/models/dial/resource';

/**
 * Core has no manifest-editing UI here: a skill without its root `SKILL.md` isn't a skill Core will
 * serve, so it's excluded from this file listing entirely (its content is edited through the
 * dedicated Skill tab — see `SkillManifestTab`) rather than shown with its remove action suppressed.
 */
const SKILL_MANIFEST_FILE = 'SKILL.md';

interface SkillFileRow extends DialSkillFile {
  /** A staged, not-yet-uploaded file — has no server-side content to preview/download yet. */
  isNew?: boolean;
}

interface Props {
  skill?: DialSkillResource;
  /** Hides add/remove — e.g. a read-only admin. Preview/download stay available either way. */
  disabled?: boolean;
  /** Files staged for upload on the next save; not yet on the server. */
  addedFiles?: File[];
  /** Names of existing files staged for removal on the next save. */
  removedFileNames?: string[];
  onAddFile?: (file: File) => void;
  onRemoveExistingFile?: (fileName: string) => void;
  onRemoveAddedFile?: (index: number) => void;
}

/**
 * Skill bundle file listing, shared between the Skill Publications properties view and the
 * `Assets > Skills` detail view. Both surfaces edit the file list identically: add/remove are staged
 * locally (via `addedFiles`/`removedFileNames`) and only committed to Core when the owning view's
 * Save is clicked — this component itself never calls Core. Preview and download work directly
 * against the skill's already-saved files (unavailable for a staged, not-yet-uploaded file).
 * `SKILL.md` is excluded from this listing — see `SkillManifestTab` for its own name/description/body
 * fields, rendered by both surfaces in a separate `Skill` tab.
 */
const SkillDetails: FC<Props> = ({
  skill,
  disabled,
  addedFiles = [],
  removedFileNames = [],
  onAddFile,
  onRemoveExistingFile,
  onRemoveAddedFile,
}) => {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rowData = useMemo<SkillFileRow[]>(() => {
    const existing = (skill?.files ?? []).filter(
      (file) => file.name !== SKILL_MANIFEST_FILE && !removedFileNames.includes(file.name),
    );
    const added = addedFiles.map((file) => ({ name: file.name, isNew: true }));
    return [...existing, ...added];
  }, [skill, removedFileNames, addedFiles]);

  const onPreview = useCallback(
    (file?: SkillFileRow) => {
      if (!skill || !file) return;
      const url = `${ApiRoute.SkillsPreview}?path=${encodeURIComponent(skill.path)}&filePath=${encodeURIComponent(file.name)}`;
      window.open(url, '_blank');
    },
    [skill],
  );

  const onDownload = useCallback(
    (file?: SkillFileRow) => {
      if (!skill || !file) return;
      const url = `${ApiRoute.SkillsDownload}?path=${encodeURIComponent(skill.path)}&filePath=${encodeURIComponent(file.name)}`;
      window.open(url, '_blank');
    },
    [skill],
  );

  const onRemove = useCallback(
    (file?: SkillFileRow) => {
      if (!file) return;
      if (file.isNew) {
        const index = addedFiles.findIndex((added) => added.name === file.name);
        if (index !== -1) {
          onRemoveAddedFile?.(index);
        }
      } else {
        onRemoveExistingFile?.(file.name);
      }
    },
    [addedFiles, onRemoveAddedFile, onRemoveExistingFile],
  );

  const isPreviewActionHidden = useCallback((_: GridApi, node: IRowNode<SkillFileRow>) => {
    return Boolean(node.data?.isNew);
  }, []);

  const isRemoveActionHidden = useCallback(() => Boolean(disabled), [disabled]);

  const onAddClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        onAddFile?.(selectedFile);
      }
      e.target.value = '';
    },
    [onAddFile],
  );

  const columnDefs = useMemo<ColDef<SkillFileRow>[]>(
    () => [
      { field: 'name', headerName: 'Name', flex: 1 },
      ACTION_COLUMN([
        getPreviewOperation(onPreview, isPreviewActionHidden),
        getDownloadOperation(onDownload, isPreviewActionHidden),
        getRemoveOperation(onRemove, isRemoveActionHidden),
      ]),
    ],
    [onPreview, onDownload, onRemove, isPreviewActionHidden, isRemoveActionHidden],
  );

  if (!skill) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-8 h-full">
      <div className="flex flex-col gap-y-2 flex-1 min-h-0">
        <div className="flex flex-row justify-between items-center">
          <h3 className="text-primary mb-4">
            {t(PublicationsI18nKey.FilesListTitle)}: {rowData.length}
          </h3>
          {!disabled && (
            <>
              <DialGhostButton
                onClick={onAddClick}
                label={t(ButtonsI18nKey.Add)}
                className="w-fit"
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                aria-label={t(ButtonsI18nKey.Add)}
                onChange={onFileInputChange}
              />
            </>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <GridView emptyDataProps={{ title: t(EntitiesI18nKey.NoFiles) }} columnDefs={columnDefs} rowData={rowData} />
        </div>
      </div>
    </div>
  );
};

export default SkillDetails;
