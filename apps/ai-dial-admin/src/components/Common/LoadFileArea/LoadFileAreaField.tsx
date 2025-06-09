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
  isMultiple?: boolean;
  elementId: string;
}

const LoadFileAreaField: FC<LoadFileAreaFieldProps> = ({
  onChangeFile,
  fieldTitle,
  elementId,
  files,
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

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        onChangeFile([...(files || []), ...Array.from(selectedFiles)]);
      }
    },
    [onChangeFile, files],
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center pb-1">
        <Field fieldTitle={`${fieldTitle}: ${isMultiple ? files?.length || 0 : ''}`} htmlFor={elementId} />
        {isMultiple && !!files?.length && (
          <div className="flex flex-row items-center gap-x-3">
            <Button
              cssClass="tertiary text-error"
              iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.DeleteAll)}
              onClick={onRemoveFiles}
            />

            <Button
              cssClass="tertiary"
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={onAddFiles}
            />
          </div>
        )}
      </div>
      <input id="file" type="file" ref={fileInputRef} hidden accept={acceptTypes} onChange={onFileChange} />
      <LoadFileArea files={files} onChangeFile={onChangeFile} acceptTypes={acceptTypes} {...props} />
    </div>
  );
};

export default LoadFileAreaField;
