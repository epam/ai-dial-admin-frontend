'use client';

import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import PopupLoader from '@/src/components/Common/FormPopup/PopupLoader';
import { FC, useCallback, useState } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ButtonsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialKeyResource } from '@/src/models/dial/resource';
import { generateKey } from '@/src/utils/keys/generate-key';

enum RotateStep {
  Confirm = 'confirm',
  Reveal = 'reveal',
}

interface Props {
  isOpen: boolean;
  asset: DialKeyResource;
  etag: string;
  onRotate: (key: DialKeyResource, etag: string) => Promise<{ success: boolean }>;
  onClose: () => void;
}

/**
 * Two-step key rotation modal.
 *
 * Step 1 (Confirm): warns the user that the current key will be deactivated and asks to confirm.
 * Step 2 (Reveal): shows the newly generated key value with a copy button. The value is only
 * visible here — Core's `@JsonProperty(WRITE_ONLY)` means GET never returns the `key` field.
 */
const KeyRotateModal: FC<Props> = ({ isOpen, asset, etag, onRotate, onClose }) => {
  const t = useI18n();
  const [step, setStep] = useState<RotateStep>(RotateStep.Confirm);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onConfirmRotate = useCallback(async () => {
    const generated = generateKey();
    setIsLoading(true);
    const res = await onRotate({ ...asset, key: generated }, etag);
    setIsLoading(false);
    if (res.success) {
      setNewKeyValue(generated);
      setStep(RotateStep.Reveal);
    }
  }, [asset, etag, onRotate]);

  const onCloseAndReset = useCallback(() => {
    setStep(RotateStep.Confirm);
    setNewKeyValue('');
    onClose();
  }, [onClose]);

  if (step === RotateStep.Confirm) {
    return (
      <Popup
        open={isOpen}
        header={t(KeysI18nKey.RotateKeyTitle)}
        portalId="KeyRotateConfirm"
        onClose={onCloseAndReset}
        mainButtons={
          isLoading
            ? []
            : getFormPopupButtons({
                cancelLabel: t(ButtonsI18nKey.Cancel),
                submitLabel: t(ButtonsI18nKey.Rotate),
                onCancel: onCloseAndReset,
                onSubmit: onConfirmRotate,
              })
        }
      >
        {isLoading ? (
          <PopupLoader />
        ) : (
          <>
            <div className="px-6 py-4">
              <p className="body-2">{t(KeysI18nKey.RotateKeyDescription)}</p>
            </div>
          </>
        )}
      </Popup>
    );
  }

  return (
    <Popup
      open={isOpen}
      header={t(KeysI18nKey.RotateKeySuccessTitle)}
      portalId="KeyRotateReveal"
      onClose={onCloseAndReset}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Close),
        submitLabel: t(ButtonsI18nKey.Create),
        submitClassName: 'hidden',
        onCancel: onCloseAndReset,
        onSubmit: onCloseAndReset,
      })}
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        <p className="body-2">{t(KeysI18nKey.KeyValueRevealDescription)}</p>
        <div className="flex items-center gap-2">
          <code className="body-2 font-mono break-all">{newKeyValue}</code>
          <CopyButton valueLabel={t(KeysI18nKey.KeyValueRevealTitle)} value={newKeyValue} />
        </div>
      </div>
    </Popup>
  );
};

export default KeyRotateModal;
