'use client';

import { DialFormPopup } from '@epam/ai-dial-ui-kit';
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
      <DialFormPopup
        open={isOpen}
        header={t(KeysI18nKey.RotateKeyTitle)}
        portalId="KeyRotateConfirm"
        isLoading={isLoading}
        onClose={onCloseAndReset}
        onCancel={onCloseAndReset}
        onSubmit={onConfirmRotate}
        cancelLabel={t(ButtonsI18nKey.Cancel)}
        submitLabel={t(ButtonsI18nKey.Rotate)}
      >
        <div className="px-6 py-4">
          <p className="body-2">{t(KeysI18nKey.RotateKeyDescription)}</p>
        </div>
      </DialFormPopup>
    );
  }

  return (
    <DialFormPopup
      open={isOpen}
      header={t(KeysI18nKey.RotateKeySuccessTitle)}
      portalId="KeyRotateReveal"
      onClose={onCloseAndReset}
      onCancel={onCloseAndReset}
      onSubmit={onCloseAndReset}
      cancelLabel={t(ButtonsI18nKey.Close)}
      submitClassName="hidden"
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        <p className="body-2">{t(KeysI18nKey.KeyValueRevealDescription)}</p>
        <div className="flex items-center gap-2">
          <code className="body-2 font-mono break-all">{newKeyValue}</code>
          <CopyButton valueLabel={t(KeysI18nKey.KeyValueRevealTitle)} value={newKeyValue} />
        </div>
      </div>
    </DialFormPopup>
  );
};

export default KeyRotateModal;
