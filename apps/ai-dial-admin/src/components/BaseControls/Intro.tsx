import { useCallback, useMemo, useState } from 'react';

import { DialTextarea } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { getErrorForIntro } from '@/src/utils/validation/intro-error';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props<T> {
  entity: T;
  disabled?: boolean;
  isFullWidth?: boolean;
  onChangeEntity?: (entity: T) => void;
}

const IntroControl = <T extends { intro?: string }>({
  entity,
  onChangeEntity,
  isFullWidth = true,
  disabled,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();
  const containerClassName = useMemo(() => getControlClassName(isFullWidth), [isFullWidth]);

  const [introError, setIntroError] = useState<FieldError | null>(null);

  const onChangeIntro = useCallback(
    (intro: string) => {
      const error = getErrorForIntro(intro, t);
      setIntroError(error);
      dispatch({ type: ValidationActionType.SetField, field: 'intro', isValid: !error });
      onChangeEntity?.({ ...entity, intro });
    },
    [dispatch, entity, onChangeEntity, t],
  );

  return (
    <DialTextarea
      id="intro"
      labelProps={{ label: t(EntityFieldsI18nKey.intro) }}
      placeholder={t(EntityPlaceholdersI18nKey.Intro)}
      value={entity.intro}
      error={introError?.text}
      invalid={introError ? true : undefined}
      onChange={onChangeIntro}
      containerClassName={containerClassName}
      disabled={disabled || isReadOnlyAdmin}
      {...props}
    />
  );
};

export default IntroControl;
