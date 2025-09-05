import { FC, useEffect, useMemo, useState } from 'react';

import { IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { isValidRoutePath } from '@/src/utils/validation/path-error';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  index: number;
  fieldTitle: string;
  path: string;
  optional?: boolean;
  readonly?: boolean;
  allPaths?: string[];
  onRemove: (index: number) => void;
  onChangePath: (index: number, value?: string) => void;
}

const Path: FC<Props> = ({ index, path, readonly, optional, fieldTitle, allPaths, onRemove, onChangePath }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [isEmptyPath, setIsEmptyPath] = useState(true);
  const [isInvalidPath, setIsInvalidPath] = useState(false);
  const isAllEmptyValues = !allPaths?.some((v) => v !== '');
  const error = useMemo(() => {
    return isEmptyPath && index === 0 && isAllEmptyValues && !optional
      ? t(ErrorI18nKey.RequiredProperty)
      : isInvalidPath
        ? t(ErrorI18nKey.InvalidPath)
        : '';
  }, [index, optional, isAllEmptyValues, isEmptyPath, isInvalidPath, t]);

  const removeButtonClass = classNames(
    'cursor-pointer ml-[10px]',
    index === 0
      ? (isEmptyPath && isAllEmptyValues) || isInvalidPath
        ? ''
        : 'mt-[18px]'
      : isInvalidPath
        ? 'mb-[16px]'
        : '',
    index === 0 && allPaths?.length === 1 ? 'text-secondary' : 'text-error',
  );

  useEffect(() => {
    setIsEmptyPath(path === '');
    setIsInvalidPath(!isValidRoutePath(path));
  }, [path]);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'path ' + index, isValid: !error });
    return () => {
      dispatch({ type: ValidationActionType.SetField, field: 'path ' + index, isValid: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div className="flex items-center">
      <div className="flex-1">
        <TextInputField
          elementId={'path ' + index}
          value={path}
          disabled={readonly}
          placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
          fieldTitle={index === 0 ? fieldTitle : ''}
          onChange={(value) => onChangePath(index, value)}
          errorText={error}
          invalid={(isEmptyPath && index === 0 && isAllEmptyValues) || isInvalidPath}
        />
      </div>
      {!readonly && (
        <button aria-label="button" className={removeButtonClass} onClick={() => onRemove(index)}>
          <IconTrash {...BASE_ICON_PROPS} />
        </button>
      )}
    </div>
  );
};

export default Path;
