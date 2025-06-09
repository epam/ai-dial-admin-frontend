import { FC, useEffect, useState } from 'react';

import { IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { RoutesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { isValidRoutePath } from '@/src/utils/validation/path-error';

interface Props {
  index: number;
  path: string;
  allPaths?: string[];
  onRemove: (index: number) => void;
  onChangePath: (index: number, value: string) => void;
}

const Path: FC<Props> = ({ index, path, allPaths, onRemove, onChangePath }) => {
  const t = useI18n();

  const [isEmptyPath, setIsEmptyPath] = useState(true);
  const [isInvalidPath, setIsInvalidPath] = useState(false);
  const isAllEmptyValues = !allPaths?.some((v) => v !== '');

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
          placeholder={t(RoutesI18nKey.PathPlaceholder)}
          fieldTitle={index === 0 ? t(RoutesI18nKey.PathTitle) : ''}
          onChange={(value) => onChangePath(index, value)}
          errorText={
            isEmptyPath && index === 0 && isAllEmptyValues
              ? t(RoutesI18nKey.RequiredProperty)
              : isInvalidPath
                ? t(RoutesI18nKey.InvalidPath)
                : ''
          }
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
