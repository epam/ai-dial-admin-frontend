'use client';

import { ChangeEvent, DragEvent, FC, useCallback, useRef, useState } from 'react';

import { EllipsisTooltip, ErrorText, FileDropzone, GhostButton, Label, NeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import { FileUploadError, FileUploadFieldProps } from '@/src/components/Common/FileUploadField/models';
import { getAccept, isTotalSizeExceeded, validateFiles } from '@/src/components/Common/FileUploadField/utils';
import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

// ui-kit 2.0 has only the empty drop area (`FileDropzone`); the file list, Add / Delete all and the
// count and size limits stay here. Delete this file when the kit ships a filled-state upload field.
const FileUploadField: FC<FileUploadFieldProps> = ({
  fieldTitle,
  elementId,
  files = [],
  acceptTypes,
  emptyTextFirstLine,
  emptyTextSecondLine,
  emptyButtonLabel,
  maxFilesCount,
  maxFileSize,
  maxMultiFilesSize,
  multiple = true,
  fileFormatError,
  fileCountError,
  fileSizeError,
  multiFilesSizeError,
  onChange,
  iconBeforeInput,
  dynamicIcon,
  isInvalid,
  errorText,
  deleteAllButtonLabel,
  addButtonLabel,
  additionalActionButtons,
}) => {
  const t = useI18n();
  const addInputRef = useRef<HTMLInputElement>(null);
  const isFormatRejectedRef = useRef(false);
  const [uploadError, setUploadError] = useState<FileUploadError>();
  const [isDragOver, setIsDragOver] = useState(false);

  const maxCount = maxFilesCount ?? (multiple ? undefined : 1);
  const hasFiles = files.length > 0;
  const errorTexts: Record<FileUploadError, string | undefined> = {
    [FileUploadError.Format]: fileFormatError,
    [FileUploadError.Size]: fileSizeError,
    [FileUploadError.Count]: fileCountError,
  };
  const selectionError = uploadError ? errorTexts[uploadError] : undefined;
  const totalSizeError = multiple && isTotalSizeExceeded(files, maxMultiFilesSize) ? multiFilesSizeError : undefined;
  const alertText = selectionError ?? totalSizeError;

  const onAddFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) {
        return;
      }
      // The kit reports a drop's rejected files, then its accepted ones, in the same tick.
      const error = isFormatRejectedRef.current
        ? FileUploadError.Format
        : validateFiles({
            incoming,
            existingCount: files.length,
            acceptTypes,
            maxFilesCount: maxCount,
            maxFileSize,
          });
      isFormatRejectedRef.current = false;
      setUploadError(error);
      if (!error) {
        onChange([...files, ...incoming]);
      }
    },
    [acceptTypes, files, maxCount, maxFileSize, onChange],
  );

  const onRejectFiles = useCallback(() => {
    isFormatRejectedRef.current = true;
    setUploadError(FileUploadError.Format);
    queueMicrotask(() => {
      isFormatRejectedRef.current = false;
    });
  }, []);

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    onAddFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  const onDropFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    onAddFiles(Array.from(event.dataTransfer.files));
  };

  const onDragOverFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const onRemoveFile = (name: string) => {
    setUploadError(undefined);
    onChange(files.filter((file) => file.name !== name));
  };

  const onDeleteAll = () => {
    setUploadError(undefined);
    onChange([]);
  };

  const label = multiple ? `${fieldTitle}: ${files.length}` : fieldTitle;
  const canAdd = !!addButtonLabel && (maxCount === undefined || files.length < maxCount);

  return (
    <div className="h-full flex flex-col gap-1">
      <span role="alert" className="sr-only">
        {alertText}
      </span>

      {hasFiles ? (
        <>
          <div className="flex justify-between items-center min-h-[42px]">
            <Label label={label} htmlFor={elementId} />
            {multiple && (
              <div className="flex flex-row items-center gap-x-2">
                {deleteAllButtonLabel && (
                  <NeutralButton
                    label={deleteAllButtonLabel}
                    iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={onDeleteAll}
                  />
                )}
                {canAdd && (
                  <GhostButton
                    label={addButtonLabel}
                    iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={() => addInputRef.current?.click()}
                  />
                )}
                {additionalActionButtons}
              </div>
            )}
          </div>
          <input
            id={elementId}
            ref={addInputRef}
            type="file"
            hidden
            aria-label={label}
            multiple={multiple}
            accept={getAccept(acceptTypes)}
            onChange={onPickFiles}
          />
          {/* Drop is a pointer-only shortcut; the Add button is the keyboard path. */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className={classNames(
              'flex flex-col gap-y-1 flex-1 min-h-0 overflow-y-auto rounded border border-solid p-2',
              isDragOver ? 'border-accent-primary' : 'border-primary',
              !!alertText && 'border-error',
            )}
            onDragOver={onDragOverFiles}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDropFiles}
          >
            {files.map((file, index) => {
              const isFileInvalid = !!isInvalid?.(file);
              return (
                <div key={`${file.name}${index}`}>
                  <div
                    className={classNames(
                      'flex items-center gap-2 h-10 px-3 rounded border border-solid',
                      isFileInvalid ? 'border-error text-error' : 'border-primary',
                    )}
                  >
                    {iconBeforeInput ?? dynamicIcon?.(file.name)}
                    <EllipsisTooltip className="flex-1 min-w-0" text={file.name} />
                    <RemoveButton
                      aria-label={`${t(ButtonsI18nKey.Delete)}: ${file.name}`}
                      onClick={() => onRemoveFile(file.name)}
                    />
                  </div>
                  {isFileInvalid && <ErrorText text={errorText} />}
                </div>
              );
            })}
          </div>
          {alertText && <ErrorText text={alertText} />}
        </>
      ) : (
        <FileDropzone
          id={elementId}
          labelProps={{ label }}
          label={emptyTextFirstLine}
          description={[emptyTextSecondLine, emptyButtonLabel].filter(Boolean).join(' ')}
          accept={getAccept(acceptTypes)}
          multiple={multiple}
          errorText={selectionError}
          onChange={onAddFiles}
          onReject={onRejectFiles}
        />
      )}
    </div>
  );
};

export default FileUploadField;
