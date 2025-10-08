import { FC, useCallback, useEffect, useState } from 'react';

import { IconPlus, IconTrash } from '@tabler/icons-react';
import classNames from 'classnames';
import { ButtonVariant, DialButton, DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityPlaceholdersI18nKey, ErrorI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import Path from './Path';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  title: string;
  readonly?: boolean;
  optional?: boolean;
  paths?: string[];
  onChangePaths: (path: string[]) => void;
}

const Paths: FC<Props> = ({ title, optional, readonly, paths, onChangePaths }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [pathError, setPathError] = useState('');

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !pathError });
  }, [dispatch, pathError]);

  useEffect(() => {
    setPathError(!paths || paths.length === 0 || paths.some((p) => !p) ? t(ErrorI18nKey.RequiredField) : '');
  }, [paths, t]);

  const onAddPath = useCallback(() => {
    const newPaths = [...(paths || [])];
    newPaths.push('');
    if (newPaths.length === 1) {
      newPaths.push('');
    }
    onChangePaths(newPaths);
  }, [paths, onChangePaths]);

  const onRemove = useCallback(
    (index: number) => {
      const newPaths = [...(paths || [])];
      if (paths?.length === 1) {
        newPaths[index] = '';
      } else {
        newPaths.splice(index, 1);
      }
      onChangePaths(newPaths);
    },
    [paths, onChangePaths],
  );

  const onChangePath = useCallback(
    (index: number, value?: string) => {
      const newPaths = [...(paths || [])];

      if (!value) {
        newPaths.splice(index, 1);
      } else {
        newPaths[index] = value;
      }
      onChangePaths(newPaths);
    },
    [paths, onChangePaths],
  );

  return (
    <div className="flex flex-col gap-y-3">
      {paths == null || paths.length === 0 ? (
        <div key="path 0" className="flex items-center">
          <div className="flex-1">
            <DialTextInputField
              elementId="path 0"
              value={''}
              disabled={readonly}
              placeholder={t(EntityPlaceholdersI18nKey.PathUrl)}
              fieldTitle={title}
              errorText={pathError}
              invalid={!!pathError}
              onChange={(value?: string) => onChangePath(0, value)}
            />
          </div>
          {!readonly && (
            <button disabled={true} aria-label="button" className={classNames('cursor-pointer ml-[10px] mt-[20px]')}>
              <IconTrash {...BASE_ICON_PROPS} />
            </button>
          )}
        </div>
      ) : (
        paths?.map((path, index) => (
          <Path
            readonly={readonly}
            key={'path ' + index}
            path={path}
            index={index}
            optional={optional}
            fieldTitle={title}
            allPaths={paths}
            onRemove={onRemove}
            onChangePath={onChangePath}
          />
        ))
      )}
      {!readonly && (
        <div>
          <DialButton
            variant={ButtonVariant.Secondary}
            title={t(RoutesI18nKey.AddPaths)}
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            onClick={onAddPath}
          />
        </div>
      )}
    </div>
  );
};

export default Paths;
