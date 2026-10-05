'use client';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';

import { Button, ButtonVariant, DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import DiscardModal from '@/src/components//EntityView/Modals/Discard/Discard';

interface Props {
  /** Explicit override; when omitted, Save follows the save-validation context's isValid. */
  disableSave?: boolean;
  children?: ReactNode;
  saveLabel?: string;
  onDiscard?: () => void;
  onSave?: () => void;
  isSaveAllowed?: boolean;
  /**
   * Draws the pair with the 2.0 buttons instead of the 1.0 ones. Off by default: this bar is rendered
   * by every entity, and the generations differ in height as well as in colour, so a page opts in as it
   * finishes its own migration rather than the whole console moving on one commit.
   */
  isDesignSystem2?: boolean;
}

const ChangedEntityButtons: FC<Props> = ({
  disableSave,
  children,
  onDiscard,
  onSave,
  saveLabel,
  isSaveAllowed = true,
  isDesignSystem2,
}) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassName, setButtonsClassName] = useState('');
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

  useEffect(() => {
    setButtonsClassName(classNames((isTablet || isMobile) && 'w-1/2 flex justify-center'));
  }, [isTablet, isMobile]);

  const onTryToDiscard = useCallback(() => {
    setIsDiscardModalOpen(true);
  }, []);

  const onDiscardModalConfirm = useCallback(() => {
    onDiscard?.();
    setIsDiscardModalOpen(false);
  }, [onDiscard]);

  return (
    <div className="flex flex-row gap-3 p-3 lg:p-0">
      {isDesignSystem2 ? (
        <Button
          variant={ButtonVariant.Neutral}
          className={buttonsClassName}
          label={t(ButtonsI18nKey.Discard)}
          onClick={onTryToDiscard}
        />
      ) : (
        <DialNeutralButton className={buttonsClassName} label={t(ButtonsI18nKey.Discard)} onClick={onTryToDiscard} />
      )}
      {children}
      {isSaveAllowed &&
        (isDesignSystem2 ? (
          <Button
            variant={ButtonVariant.Primary}
            className={buttonsClassName}
            label={saveLabel || t(ButtonsI18nKey.Save)}
            onClick={() => onSave?.()}
            disabled={disableSave ?? !isValid}
          />
        ) : (
          <DialPrimaryButton
            className={buttonsClassName}
            label={saveLabel || t(ButtonsI18nKey.Save)}
            onClick={() => onSave?.()}
            disabled={disableSave ?? !isValid}
          />
        ))}
      {isDiscardModalOpen && (
        <DiscardModal
          onConfirm={onDiscardModalConfirm}
          onClose={() => setIsDiscardModalOpen(false)}
          onCancel={() => setIsDiscardModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ChangedEntityButtons;
