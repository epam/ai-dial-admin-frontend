'use client';

import { Popup, Step, StepStatus, Steps } from '@epam/ai-dial-ui-kit';

import PopupLoader from '@/src/components/Common/FormPopup/PopupLoader';
import { FC, useCallback, useMemo, useState } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { getStepStatusLabels } from '@/src/components/Common/Steps/utils';
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
 * Two-step key rotation modal, rendered as one popup with the ui-kit `Steps` indicator.
 *
 * Step 1 (Confirm): warns the user that the current key will be deactivated and asks to confirm.
 * Step 2 (Reveal): shows the newly generated key value with a copy button. The value is only
 * visible here — Core's `@JsonProperty(WRITE_ONLY)` means GET never returns the `key` field.
 * It is an informative last step: the Confirm step is locked and the footer offers only Close.
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

  const onChangeStep = useCallback((id: string) => setStep(id as RotateStep), []);
  const isRevealStep = step === RotateStep.Reveal;

  const steps = useMemo<Step[]>(
    () => [
      {
        id: RotateStep.Confirm,
        name: t(ButtonsI18nKey.Confirm),
        status: StepStatus.VALID,
        disabled: isRevealStep,
      },
      {
        id: RotateStep.Reveal,
        name: t(KeysI18nKey.KeyValueRevealTitle),
        status: isRevealStep ? StepStatus.VALID : undefined,
        disabled: !isRevealStep,
      },
    ],
    [t, isRevealStep],
  );

  const title = t(isRevealStep ? KeysI18nKey.RotateKeySuccessTitle : KeysI18nKey.RotateKeyTitle);

  return (
    <Popup open={isOpen} header={title} portalId="KeyRotate" onClose={onCloseAndReset}>
      <div className="flex flex-col py-4 px-6 gap-y-6">
        <Steps
          steps={steps}
          currentStep={step}
          onChangeStep={onChangeStep}
          ariaLabel={title}
          statusLabels={getStepStatusLabels(t)}
        />
        {step === RotateStep.Confirm &&
          (isLoading ? <PopupLoader /> : <p className="body-2">{t(KeysI18nKey.RotateKeyDescription)}</p>)}
        {isRevealStep && (
          <div className="flex flex-col gap-4">
            <p className="body-2">{t(KeysI18nKey.KeyValueRevealDescription)}</p>
            <div className="flex items-center gap-2">
              <code className="body-2 font-mono break-all">{newKeyValue}</code>
              <CopyButton valueLabel={t(KeysI18nKey.KeyValueRevealTitle)} value={newKeyValue} />
            </div>
          </div>
        )}
      </div>

      <StepperModalButtons
        steps={steps}
        currentStep={steps.find((item) => item.id === step)}
        finishButtonLabel={t(ButtonsI18nKey.Rotate)}
        isLastStepInformative
        isLoading={isLoading}
        onChangeStep={onChangeStep}
        onFinishClick={onConfirmRotate}
        onClose={onCloseAndReset}
      />
    </Popup>
  );
};

export default KeyRotateModal;
