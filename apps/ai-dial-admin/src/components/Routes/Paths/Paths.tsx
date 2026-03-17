import { FC, useCallback, useEffect, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import { ErrorI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import Path from './Path';

interface Props {
  label: string;
  disabled?: boolean;
  required?: boolean;
  paths?: string[];
  disableValidation?: boolean;
  onChangePaths: (path: string[]) => void;
}

const Paths: FC<Props> = ({ label, required, disabled, paths, disableValidation, onChangePaths }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [pathError, setPathError] = useState('');

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'path', isValid: !pathError });
  }, [dispatch, pathError]);

  useEffect(() => {
    setPathError(
      required && (!paths || paths.length === 0 || paths.some((p) => !p)) ? t(ErrorI18nKey.RequiredField) : '',
    );
  }, [required, paths, t]);

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
      let newPaths = [...(paths || [])];

      if (!value) {
        newPaths.splice(index, 1);
      } else {
        newPaths[index] = value;
      }

      if (newPaths?.length === 0) {
        newPaths.push('');
      }
      onChangePaths(newPaths);
    },
    [paths, onChangePaths],
  );

  return (
    <div className={classNames('flex flex-col gap-y-3', STANDARD_CONTROL_WIDTH)}>
      {paths?.map((path, index) => (
        <Path
          disabled={disabled}
          key={`path-${index}`}
          path={path}
          index={index}
          required={required}
          label={label}
          allPaths={paths}
          onRemove={onRemove}
          onChangePath={onChangePath}
          disableValidation={disableValidation}
        />
      ))}
      {!disabled && (
        <div>
          <DialNeutralButton
            label={t(RoutesI18nKey.AddPaths)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onAddPath}
          />
        </div>
      )}
    </div>
  );
};

export default Paths;
