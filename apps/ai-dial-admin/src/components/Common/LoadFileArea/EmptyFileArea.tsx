import classNames from 'classnames';
import { ChangeEvent, DragEvent, FC, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DropTargetMonitor } from 'react-dnd';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';

import Button from '@/src/components/Common/Button/Button';
import { BasicI18nKey, CommonControlsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import ErrorText from '@/src/components/Common/ErrorText/ErrorText';

interface Props {
  emptyTitle: string;
  acceptTypes: string;
  maxFilesCount?: number;
  isMultiple?: boolean;
  fileFormatError?: string;
  fileCountError?: string;
  getIsFileFormatError?: (fileItems: File[] | DataTransferItem[]) => boolean;
  onChange: (files: File[]) => void;
}

const EmptyFileArea: FC<Props> = ({
  onChange,
  emptyTitle,
  acceptTypes,
  maxFilesCount,
  isMultiple,
  fileFormatError,
  fileCountError,
  getIsFileFormatError,
}) => {
  const t = useI18n();
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[] | DataTransferItem[]>([]);
  const [isErrorFileFormat, setIsErrorFileFormat] = useState<boolean>(false);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const filesList = e.target.files;
      if (filesList && filesList.length > 0) {
        const selectedFiles = Array.from(filesList);
        const isFormatError = getIsFileFormatError?.(selectedFiles);

        if (!isFormatError) {
          onChange(selectedFiles);
        } else {
          setIsErrorFileFormat(true);
        }
      }
    },
    [getIsFileFormatError, onChange],
  );

  const getIsFileCountError = useCallback(
    (fileItems: File[] | DataTransferItem[]) => {
      return maxFilesCount && fileItems?.length > maxFilesCount;
    },
    [maxFilesCount],
  );

  const isFileValidationError = useMemo(() => {
    return isErrorFileFormat || getIsFileCountError(files);
  }, [isErrorFileFormat, files, getIsFileCountError]);

  const clearErrorState = () => {
    setFiles([]);
    setIsErrorFileFormat(false);
  };

  useEffect(() => {
    clearErrorState();
  }, [acceptTypes]);

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(selectedFiles: { files: File[] }) {
        const files = selectedFiles.files;
        if (!getIsFileFormatError?.(files) && !getIsFileCountError(files)) {
          onChange(files);
        }
        clearErrorState();
      },
      collect: (monitor: DropTargetMonitor) => {
        return {
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
    }),
    [onFileChange],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === 'Enter' || event.key === 'Space') {
      event.preventDefault(); // Prevent scrolling on space press
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event?.preventDefault();

    const fileItems = Array.from(event.dataTransfer?.items);

    setIsErrorFileFormat(!!getIsFileFormatError?.(fileItems));
    setFiles(fileItems);
  };

  const handleDragLeave = (event: DragEvent) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    clearErrorState();
  };

  const containerCssClasses = classNames(
    'border border-dashed rounded w-full cursor-pointer relative h-full hover:border-hover',
    !canDrop && !isFileValidationError && 'border-primary',
    canDrop && (!isOver ? 'border-hover' : 'border-accent-primary'),
    isFileValidationError && 'border-error',
  );

  drop(dropRef);

  return (
    <>
      <div className={containerCssClasses} ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <label
          htmlFor="file"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="flex flex-col items-center cursor-pointer h-full w-full text-secondary tiny justify-center"
        >
          <p className="mb-1">{emptyTitle}</p>
          <p className="mb-0.5"> {t(CommonControlsI18nKey.Or)}</p>
          <Button cssClass="tertiary" title={t(BasicI18nKey.Browse)} onClick={() => fileInputRef.current?.click()} />
        </label>
        <input
          multiple={isMultiple}
          id="file"
          type="file"
          ref={fileInputRef}
          hidden
          accept={acceptTypes}
          onChange={onFileChange}
        />
      </div>
      <>
        {isErrorFileFormat ? (
          <ErrorText errorText={fileFormatError} />
        ) : (
          getIsFileCountError(files) && <ErrorText errorText={fileCountError} />
        )}
      </>
    </>
  );
};

export default EmptyFileArea;
