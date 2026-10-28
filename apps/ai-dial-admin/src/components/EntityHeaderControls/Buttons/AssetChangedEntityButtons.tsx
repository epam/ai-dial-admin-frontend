'use client';

import { FC, useCallback, useMemo } from 'react';

import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  isEditorEnabled?: boolean;
  isSaving?: boolean;
  isSaveDisabled?: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

const AssetChangedEntityButtons: FC<Props> = ({ isEditorEnabled, onDiscard, onSave, isSaving, isSaveDisabled }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const isDisableSave = useMemo(
    () => (isEditorEnabled ? false : !isValid || !!isSaving),
    [isEditorEnabled, isValid, isSaving],
  );

  const onStartDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });
    onDiscard();
  }, [dispatch, onDiscard]);

  return (
    <ChangedEntityButtons
      onDiscard={onStartDiscard}
      onSave={onSave}
      disableSave={isDisableSave || !!isSaveDisabled}
      saveLabel={t(ButtonsI18nKey.Save)}
    />
  );
};

export default AssetChangedEntityButtons;
