'use client';

import { ChangeEvent, FC, useCallback, useMemo, useRef, useState } from 'react';

import {
  ButtonDropdown,
  ButtonVariant,
  DropdownItem,
  ElementSize,
  ErrorText,
  FileDropzone,
  Label,
} from '@epam/ai-dial-ui-kit';

import ContextFileCard from '@/src/components/Assets/Artifacts/Projects/View/ContextFileCard';
import ContextFilesPicker from '@/src/components/Assets/Artifacts/Projects/View/ContextFilesPicker';
import { ApiRoute } from '@/src/constants/api-routes';
import { ButtonsI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ContextFileRejectionReason,
  ProjectContextLimits,
  RejectedContextFile,
  StoredContextFile,
} from '@/src/models/project-context';
import { checkContextFiles, formatContextSize, getContextFilesSize } from '@/src/utils/project-context';
import { toContextFilePath } from '@/src/utils/project-manifest';

interface Props {
  /** The project's path, used to download stored files; absent while nothing is stored yet. */
  projectPath?: string;
  storedFiles: StoredContextFile[];
  /** Names of stored files staged for removal on the next save. */
  removedFileNames: string[];
  /** Files staged for upload on the next save; not yet on the server. */
  addedFiles: File[];
  limits: ProjectContextLimits;
  disabled?: boolean;
  onAddFiles: (files: File[]) => void;
  onRemoveStoredFile: (fileName: string) => void;
  onRemoveAddedFile: (index: number) => void;
}

const REJECTION_KEYS: Record<ContextFileRejectionReason, ProjectI18nKey> = {
  [ContextFileRejectionReason.Extension]: ProjectI18nKey.RejectedExtension,
  [ContextFileRejectionReason.FileSize]: ProjectI18nKey.RejectedFileSize,
  [ContextFileRejectionReason.TotalSize]: ProjectI18nKey.RejectedTotalSize,
  [ContextFileRejectionReason.FileCount]: ProjectI18nKey.RejectedFileCount,
  [ContextFileRejectionReason.Duplicate]: ProjectI18nKey.RejectedDuplicate,
};

/** The download URL of a stored context file — `filePath` is relative to the project root. */
const getDownloadUrl = (projectPath: string, fileName: string): string =>
  `${ApiRoute.ProjectsDownload}?path=${encodeURIComponent(projectPath)}&filePath=${encodeURIComponent(toContextFilePath(fileName))}`;

/**
 * The `Context` section of a project, styled like the chat application's project form: a capacity meter, an
 * add menu (from the device or from file storage), a dropzone, rejection messages and one tile per file. Controlled — the owning view stages
 * additions and removals and writes them on Save; this component never calls Core. Only files under `context/`
 * are shown (the owning view filters them), so the manifest and any other file are neither listed nor addable.
 */
const ContextFiles: FC<Props> = ({
  projectPath,
  storedFiles,
  removedFileNames,
  addedFiles,
  limits,
  disabled,
  onAddFiles,
  onRemoveStoredFile,
  onRemoveAddedFile,
}) => {
  const t = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [rejections, setRejections] = useState<RejectedContextFile[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const visibleStoredFiles = useMemo(
    () => storedFiles.filter((file) => !removedFileNames.includes(file.name)),
    [storedFiles, removedFileNames],
  );
  const remaining = useMemo<StoredContextFile[]>(
    () => [...visibleStoredFiles, ...addedFiles.map((file) => ({ name: file.name, size: file.size }))],
    [visibleStoredFiles, addedFiles],
  );
  const usedBytes = getContextFilesSize(remaining);
  const accept = limits.allowedExtensions.map((extension) => `.${extension}`).join(',');
  const usedPercent = Math.min(100, Math.round((usedBytes / limits.maxTotalBytes) * 100));

  const onAdd = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) {
        return;
      }
      const { accepted, rejected } = checkContextFiles(incoming, remaining, limits);
      setRejections(rejected);
      if (accepted.length > 0) {
        onAddFiles(accepted);
      }
      setStatusMessage(
        [
          accepted.length > 0 ? t(ProjectI18nKey.FilesAddedStatus, { count: String(accepted.length) }) : '',
          ...rejected.map(({ name, reason }) => t(REJECTION_KEYS[reason], { name })),
        ]
          .filter(Boolean)
          .join(' '),
      );
    },
    [limits, onAddFiles, remaining, t],
  );

  const addItems: DropdownItem[] = [
    { key: 'device', label: t(ProjectI18nKey.AddFromDevice), onClick: () => inputRef.current?.click() },
    { key: 'storage', label: t(ProjectI18nKey.AddFromStorage), onClick: () => setIsPickerOpen(true) },
  ];

  const onClosePicker = useCallback(() => setIsPickerOpen(false), []);

  const onDownloadStoredFile = useCallback(
    (fileName: string) => {
      if (!projectPath) {
        return;
      }
      // The route streams the file as an attachment, so navigating to it downloads without leaving the page.
      window.open(getDownloadUrl(projectPath, fileName), '_self', 'noopener,noreferrer');
    },
    [projectPath],
  );

  const onChooseFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onAdd(Array.from(event.target.files ?? []));
      event.target.value = '';
    },
    [onAdd],
  );

  const onRemoveStored = useCallback(
    (name: string) => {
      onRemoveStoredFile(name);
      setRejections([]);
      setStatusMessage(t(ProjectI18nKey.FileRemovedStatus, { name }));
    },
    [onRemoveStoredFile, t],
  );

  const onRemoveAdded = useCallback(
    (index: number) => {
      const name = addedFiles[index]?.name ?? '';
      onRemoveAddedFile(index);
      setRejections([]);
      setStatusMessage(t(ProjectI18nKey.FileRemovedStatus, { name }));
    },
    [addedFiles, onRemoveAddedFile, t],
  );

  return (
    <section aria-label={t(ProjectI18nKey.Context)} className="flex flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
        <Label label={t(ProjectI18nKey.Context)} />
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              role="progressbar"
              aria-label={t(ProjectI18nKey.CapacityMeterLabel)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={usedPercent}
              className="h-1.5 w-24 overflow-hidden rounded bg-layer-4"
            >
              <div className="h-full bg-accent-primary" style={{ width: `${usedPercent}%` }} />
            </div>
            <span className="dial-tiny-text text-secondary">
              {t(ProjectI18nKey.CapacityLabel, {
                used: formatContextSize(usedBytes),
                max: formatContextSize(limits.maxTotalBytes),
              })}
            </span>
          </div>
          <ButtonDropdown
            items={addItems}
            label={t(ButtonsI18nKey.Add)}
            variant={ButtonVariant.Neutral}
            size={ElementSize.Small}
            disabled={disabled}
          />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        tabIndex={-1}
        aria-hidden
        aria-label={t(ButtonsI18nKey.Add)}
        className="sr-only"
        onChange={onChooseFiles}
      />
      <FileDropzone
        label={t(ProjectI18nKey.DropZoneLabel)}
        description={t(ProjectI18nKey.DropZoneHint, {
          extensions: limits.allowedExtensions.join(', '),
          size: formatContextSize(limits.maxFileBytes),
        })}
        accept={accept}
        multiple
        disabled={disabled}
        onChange={onAdd}
        onReject={onAdd}
      />
      {rejections.length > 0 && (
        <ul className="flex flex-col gap-1">
          {rejections.map(({ name, reason }) => (
            <li key={`${reason}:${name}`}>
              <ErrorText text={t(REJECTION_KEYS[reason], { name })} />
            </li>
          ))}
        </ul>
      )}
      {remaining.length > 0 && (
        <ul className="flex min-w-0 flex-wrap gap-2 pt-1">
          {visibleStoredFiles.map((file) => (
            <li key={`stored:${file.name}`}>
              <ContextFileCard
                name={file.name}
                size={file.size}
                disabled={disabled}
                onDownload={projectPath ? () => onDownloadStoredFile(file.name) : undefined}
                onRemove={() => onRemoveStored(file.name)}
              />
            </li>
          ))}
          {addedFiles.map((file, index) => (
            <li key={`added:${file.name}`}>
              <ContextFileCard
                name={file.name}
                size={file.size}
                disabled={disabled}
                onRemove={() => onRemoveAdded(index)}
              />
            </li>
          ))}
        </ul>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
      <ContextFilesPicker isOpen={isPickerOpen} onClose={onClosePicker} onPick={onAdd} />
    </section>
  );
};

export default ContextFiles;
