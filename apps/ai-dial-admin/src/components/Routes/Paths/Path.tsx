import { FC, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialRemoveButton, DialInput } from '@epam/ai-dial-ui-kit';

import { EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { isValidRoutePath } from '@/src/utils/validation/path-error';

interface Props {
  index: number;
  fieldTitle: string;
  path: string;
  optional?: boolean;
  readonly?: boolean;
  allPaths?: string[];
  disableValidation?: boolean;
  onRemove: (index: number) => void;
  onChangePath: (index: number, value?: string) => void;
}

const Path: FC<Props> = ({
  index,
  path,
  readonly,
  optional,
  fieldTitle,
  allPaths,
  disableValidation,
  onRemove,
  onChangePath,
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [isEmptyPath, setIsEmptyPath] = useState(true);
  const [isInvalidPath, setIsInvalidPath] = useState(false);
  const isAllEmptyValues = !allPaths?.some((v) => v !== '');
  const error = useMemo(() => {
    return disableValidation
      ? ''
      : isEmptyPath && index === 0 && isAllEmptyValues && !optional
        ? t(ErrorI18nKey.RequiredProperty)
        : isInvalidPath
          ? t(ErrorI18nKey.InvalidPath)
          : '';
  }, [disableValidation, isEmptyPath, index, isAllEmptyValues, optional, t, isInvalidPath]);

  const alignmentClassName =
    index === 0 ? (error ? 'items-start' : 'items-end') : error ? 'items-start' : 'items-center';

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
    <div className={classNames('flex flex-row gap-x-2', alignmentClassName)}>
      <div className="flex-1 min-w-0">
        <DialInput
          elementId={`path-${index}`}
          value={path}
          disabled={readonly}
          placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
          fieldTitle={index === 0 ? fieldTitle : ''}
          onChange={(value) => onChangePath(index, value)}
          errorText={error}
          invalid={!!error}
        />
      </div>
      {!readonly && (
        <DialRemoveButton onClick={() => onRemove(index)} className={error && index === 0 ? 'mt-[22px]' : ''} />
      )}
    </div>
  );
};

export default Path;
