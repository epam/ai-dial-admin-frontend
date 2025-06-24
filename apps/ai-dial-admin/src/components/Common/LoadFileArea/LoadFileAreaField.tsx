import { ChangeEvent, FC, useCallback, useRef } from 'react';
import { IconPlus, IconTrashX } from '@tabler/icons-react';

import Field from '@/src/components/Common/Field/Field';
import Button from '@/src/components/Common/Button/Button';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import LoadFileArea, { LoadFileAreaProps } from './LoadFileArea';

interface LoadFileAreaFieldProps extends LoadFileAreaProps {
  fieldTitle: string;
  elementId: string;
}

const LoadFileAreaField: FC<LoadFileAreaFieldProps> = ({
  onChangeFile,
  fieldTitle,
  elementId,
  files,
  maxFilesCount,
  fileFormatError,
  fileCountError,
  isMultiple = true,
  acceptTypes,
  ...props
}) => {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onAddFiles = () => fileInputRef.current?.click();

  const onRemoveFiles = () => {
    onChangeFile([]);
  };

  const getIsFileFormatError = useCallback(
    (fileItems: File[] | DataTransferItem[]) => {
      return fileItems?.some(
        (fileItem) =>
          fileItem.type === '' ||
          !(acceptTypes === '/' || acceptTypes?.toLowerCase()?.includes(fileItem?.type?.toLowerCase())),
      );
    },
    [acceptTypes],
  );

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const filesList = e.target.files;
      if (filesList && filesList.length > 0) {
        const selectedFiles = Array.from(filesList);
        const isFileFormatError = getIsFileFormatError(selectedFiles);

        if (!isFileFormatError) {
          onChangeFile([...(files || []), ...selectedFiles]);
        }
      }
    },
    [onChangeFile, files, getIsFileFormatError],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center pb-1 min-h-[42px]">
        <Field fieldTitle={`${fieldTitle}: ${isMultiple ? files?.length || 0 : ''}`} htmlFor={elementId} />
        {isMultiple && !!files?.length && (
          <div className="flex flex-row items-center gap-x-2">
            <Button
              cssClass="tertiary text-error"
              iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.DeleteAll)}
              onClick={onRemoveFiles}
            />

            {(maxFilesCount ? maxFilesCount > files?.length : true) && (
              <Button
                cssClass="tertiary"
                iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                title={t(ButtonsI18nKey.Add)}
                onClick={onAddFiles}
              />
            )}
          </div>
        )}
      </div>
      {files && files.length > 0 && (
        <input
          id="file"
          type="file"
          multiple={isMultiple}
          ref={fileInputRef}
          hidden
          accept={acceptTypes}
          onChange={onFileChange}
        />
      )}
      <LoadFileArea
        files={files}
        onChangeFile={onChangeFile}
        acceptTypes={acceptTypes}
        maxFilesCount={maxFilesCount}
        isMultiple={isMultiple}
        fileFormatError={fileFormatError}
        fileCountError={fileCountError}
        getIsFileFormatError={getIsFileFormatError}
        {...props}
      />
    </div>
  );
};

export default LoadFileAreaField;
