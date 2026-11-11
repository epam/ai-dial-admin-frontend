'use client';

import { Popup, Step, StepStatus, Steps } from '@epam/ai-dial-ui-kit';

import PopupLoader from '@/src/components/Common/FormPopup/PopupLoader';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo, useState } from 'react';

import { createKey } from '@/src/app/[lang]/platform-keys/actions';
import IdControl from '@/src/components/BaseControls/Id/Id';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { getStepStatusLabels } from '@/src/components/Common/Steps/utils';
import { ButtonsI18nKey, EntityFieldsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { useKeysFolder } from '@/src/context/assets/KeysFolderContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialKeyResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { getRootFolder } from '@/src/utils/files/root-folder';
import { generateKey } from '@/src/utils/keys/generate-key';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

enum DuplicateStep {
  Name = 'name',
  Reveal = 'reveal',
}

interface Props {
  isOpen: boolean;
  names: string[];
  entity: DialKeyResource;
  onClose: () => void;
}

/**
 * Two-step duplicate modal for platform keys, rendered as one popup with the ui-kit `Steps` indicator.
 *
 * Step 1 (Name): user renames the clone; `project` and `roles` are copied silently from the
 * source entity. Submit generates a new key client-side and calls `createKey`.
 * Step 2 (Reveal): shows the generated key value with a copy button — same UX as the
 * `CreateKeyModal` reveal step. It is an informative last step: the Name step is locked and the
 * footer offers only Close, which navigates to the new key's detail page.
 *
 * This modal owns its own `createKey` call (does not go through `handleDuplicate` /
 * `handleCreateAsset`) so it can show the Reveal step before closing.
 */
const DuplicatePlatformKeyModal: FC<Props> = ({ isOpen, names, entity, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const { isValid } = useSaveValidationContext();
  const { fetchFiles } = useKeysFolder();

  const [step, setStep] = useState<DuplicateStep>(DuplicateStep.Name);
  const [name, setName] = useState<string>(() => getClonedEntityName(entity.name, true));
  const [createdKeyValue, setCreatedKeyValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChangeName = useCallback(({ name: newName }: { name?: string }) => {
    setName(newName || '');
  }, []);

  const onSubmit = useCallback(() => {
    const generated = generateKey();
    setIsLoading(true);
    createKey({ ...entity, name, key: generated }).then((res) => {
      setIsLoading(false);
      if (res.success) {
        setCreatedKeyValue(generated);
        setStep(DuplicateStep.Reveal);
        // Flat platform resources (keys, models, roles…) have `folderId: ''` on the
        // individually-fetched entity — the `keys/platform/` prefix consumes the `platform`
        // segment during path parsing. The list displays `fetchedFoldersData['platform/']`,
        // so refreshing with `entity.folderId` (`''`) updates the wrong path and the new key
        // never appears. Mirror `handleCreateAsset`'s fallback to the view's root folder.
        fetchFiles(`${getRootFolder(ApplicationRoute.PlatformKeys)}/`);
      }
    });
  }, [entity, name, fetchFiles]);

  const onCloseAndNavigate = useCallback(() => {
    const createdName = name;
    setStep(DuplicateStep.Name);
    setName(getClonedEntityName(entity.name, true));
    setCreatedKeyValue('');
    onClose();
    if (createdName) {
      router.push(getUrnForEntity(ApplicationRoute.PlatformKeys, { name: createdName }));
    }
  }, [entity.name, name, onClose, router]);

  const onChangeStep = useCallback((id: string) => setStep(id as DuplicateStep), []);
  const isRevealStep = step === DuplicateStep.Reveal;
  const onCloseModal = isRevealStep ? onCloseAndNavigate : onClose;

  const steps = useMemo<Step[]>(
    () => [
      {
        id: DuplicateStep.Name,
        name: t(EntityFieldsI18nKey.name),
        status: isValid ? StepStatus.VALID : undefined,
        disabled: isRevealStep,
      },
      {
        id: DuplicateStep.Reveal,
        name: t(KeysI18nKey.KeyValueRevealTitle),
        status: isRevealStep ? StepStatus.VALID : undefined,
        disabled: !isRevealStep,
      },
    ],
    [t, isValid, isRevealStep],
  );

  const title = getCloneTitle(ApplicationRoute.PlatformKeys, t);

  return (
    <Popup open={isOpen} header={title} portalId="DuplicatePlatformKey" onClose={onCloseModal}>
      <div className="flex flex-col py-4 px-6 gap-y-6">
        <Steps
          steps={steps}
          currentStep={step}
          onChangeStep={onChangeStep}
          ariaLabel={title}
          statusLabels={getStepStatusLabels(t)}
        />
        {step === DuplicateStep.Name &&
          (isLoading ? <PopupLoader /> : <IdControl entity={{ name }} names={names} onChangeEntity={onChangeName} />)}
        {isRevealStep && (
          <div className="flex flex-col gap-4">
            <p className="body-2">{t(KeysI18nKey.KeyValueRevealDescription)}</p>
            <div className="flex items-center gap-2">
              <code className="body-2 font-mono break-all">{createdKeyValue}</code>
              <CopyButton valueLabel={t(KeysI18nKey.KeyValueRevealTitle)} value={createdKeyValue} />
            </div>
          </div>
        )}
      </div>

      <StepperModalButtons
        steps={steps}
        currentStep={steps.find((item) => item.id === step)}
        finishButtonLabel={t(ButtonsI18nKey.Duplicate)}
        isLastStepInformative
        isLoading={isLoading}
        onChangeStep={onChangeStep}
        onFinishClick={onSubmit}
        onClose={onCloseModal}
      />
    </Popup>
  );
};

export default DuplicatePlatformKeyModal;
