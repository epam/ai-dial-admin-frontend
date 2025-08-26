import { FC, useEffect, useMemo, useState } from 'react';

import { IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { isValidRoutePath } from '@/src/utils/validation/path-error';

interface Props {
  index: number;
  fieldTitle: string;
  path: string;
  allPaths?: string[];
  onRemove: (index: number) => void;
  onChangePath: (index: number, value?: string) => void;
}

const Path: FC<Props> = ({ index, path, fieldTitle, allPaths, onRemove, onChangePath }) => {
  const t = useI18n();

  const [isEmptyPath, setIsEmptyPath] = useState(true);
  const [isInvalidPath, setIsInvalidPath] = useState(false);
  const isAllEmptyValues = !allPaths?.some((v) => v !== '');
  const error = useMemo(() => {
    return isEmptyPath && index === 0 && isAllEmptyValues
      ? t(ErrorI18nKey.RequiredProperty)
      : isInvalidPath
        ? t(ErrorI18nKey.InvalidPath)
        : '';
  }, [index, isAllEmptyValues, isEmptyPath, isInvalidPath, t]);

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

  return (
    <div className="flex items-center">
      <div className="flex-1">
        <TextInputField
          elementId={'path ' + index}
          value={path}
          placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
          fieldTitle={index === 0 ? fieldTitle : ''}
          onChange={(value) => onChangePath(index, value)}
          errorText={error}
          invalid={(isEmptyPath && index === 0 && isAllEmptyValues) || isInvalidPath}
        />
      </div>
      <button aria-label="button" className={removeButtonClass} onClick={() => onRemove(index)}>
        <IconTrash {...BASE_ICON_PROPS} />
      </button>
    </div>
  );
};

export default Path;
