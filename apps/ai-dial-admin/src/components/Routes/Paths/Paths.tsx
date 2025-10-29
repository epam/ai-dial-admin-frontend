import { FC, useCallback, useEffect, useState } from 'react';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { ErrorI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import Path from './Path';

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
    if (optional) {
      dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !pathError });
    }
  }, [dispatch, optional, pathError]);

  useEffect(() => {
    if (!optional) {
      setPathError(!paths || paths.length === 0 || paths.some((p) => !p) ? t(ErrorI18nKey.RequiredField) : '');
    }
  }, [paths, optional, t]);

  const onAddPath = useCallback(() => {
    const newPaths = [...(paths || []), ''];
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
      {paths?.map((path, index) => (
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
      ))}
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
