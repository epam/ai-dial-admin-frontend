'use client';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';

import { DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useNotification } from '@/src/context/NotificationContext';
import { showEditorErrorNotifications } from './utils';

interface Props {
  disableSave?: boolean;
  children?: ReactNode;
  saveLabel?: string;
  onDiscard?: () => void;
  onSave?: () => void;
}

const ChangedEntityButtons: FC<Props> = ({ disableSave, children, onDiscard, onSave, saveLabel }) => {
  const t = useI18n();
  const { dispatch, jsonErrors } = useSaveValidationContext();
  const { showNotification } = useNotification();

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassName, setButtonsClassName] = useState('');

  useEffect(() => {
    setButtonsClassName(classNames((isTablet || isMobile) && 'w-1/2 flex justify-center'));
  }, [isTablet, isMobile]);

  const onTryToSave = useCallback(() => {
    if (jsonErrors?.length) {
      const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
      dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
    } else {
      onSave?.();
    }
  }, [jsonErrors, showNotification, t, dispatch, onSave]);

  return (
    <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
      <DialNeutralButton className={buttonsClassName} label={t(ButtonsI18nKey.Discard)} onClick={onDiscard} />
      {children}
      <DialPrimaryButton
        className={buttonsClassName}
        label={saveLabel || t(ButtonsI18nKey.Save)}
        onClick={onTryToSave}
        disabled={disableSave}
      />
    </div>
  );
};

export default ChangedEntityButtons;
