'use client';

import { Popup, Step, StepStatus, Steps } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, ReactNode, useCallback, useMemo, useState } from 'react';

import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { getStepStatusLabels } from '@/src/components/Common/Steps/utils';
import { ALIAS_NAME_PATTERN } from '@/src/constants/aliases';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AliasI18nKey, ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAliasResource } from '@/src/models/dial/alias';
import { AssetSource } from '@/src/models/dial/asset-source';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { AliasCreateStep } from './constants';
import AliasCreateProperties from './CreateProperties';

interface Props {
  isOpen: boolean;
  /** The aliases already in the bucket the new one is written to. */
  names: string[];
  /** The bucket the alias is written to: the Platform one, or the Public one when the flat Public tab is active. */
  bucket?: AssetSource.Public | AssetSource.Platform;
  /** Seeds the form, e.g. from the alias being duplicated. */
  initialValues?: Partial<DialAliasResource>;
  /** Rendered above the form, for an entry point that lets the user choose the destination. */
  topSlot?: ReactNode;
  createEntity: (entity: AssetWithVersion) => Promise<ServerActionResponse>;
  onClose: () => void;
}

/**
 * The create wizard for an alias. Step 1 names and describes it, step 2 says what it forwards to; roles are
 * edited on the details view. An alias has no versions or folders, so it is written to the flat `platform/` or
 * `public/` bucket, which `folderId` carries to the create action.
 */
const CreateAliasModal: FC<Props> = ({
  isOpen,
  names,
  bucket = AssetSource.Platform,
  initialValues,
  topSlot,
  createEntity,
  onClose,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { isValid } = useSaveValidationContext();
  const protectedRequest = useProtectedRequest();
  const { showNotification } = useNotification();
  const [alias, setAlias] = useState<DialAliasResource>(() => ({ name: '', ...initialValues }));
  const [step, setStep] = useState(AliasCreateStep.Details);
  const isTargetStep = step === AliasCreateStep.Target;
  const title = getCreateEntityTitle(ApplicationRoute.AssetsAliases, t);

  const onCreate = useCallback(async () => {
    const root = bucket === AssetSource.Public ? ROOT_FOLDER : PLATFORM_ROOT_FOLDER;
    const payload = { ...alias, name: alias.name?.trim(), folderId: `${root}/` };

    const res = await protectedRequest(createEntity, payload as unknown as AssetWithVersion);
    if (!res.success) {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      return;
    }

    showNotification(
      getSuccessNotification(
        getCreateNotificationTitle(ApplicationRoute.AssetsAliases, t),
        getCreateNotificationDescription(ApplicationRoute.AssetsAliases, payload.name ?? '', t),
      ),
    );
    const created = res.response
      ? { ...payload, ...res.response, name: res.response?._metadata?.name || res.response.name || payload.name }
      : payload;
    router.push(getUrnForEntity(ApplicationRoute.AssetsAliases, created));
    onClose();
  }, [alias, bucket, createEntity, protectedRequest, showNotification, t, router, onClose]);

  const isNameValid = !!alias.name && ALIAS_NAME_PATTERN.test(alias.name);
  const steps = useMemo<Step[]>(
    () => [
      {
        id: AliasCreateStep.Details,
        name: t(TabsI18nKey.Properties),
        status: isNameValid && (isTargetStep || isValid) ? StepStatus.VALID : undefined,
      },
      {
        id: AliasCreateStep.Target,
        name: t(AliasI18nKey.Target),
        status: isTargetStep && !!alias.target?.path && isValid ? StepStatus.VALID : undefined,
      },
    ],
    [t, isNameValid, isTargetStep, isValid, alias.target?.path],
  );

  const onChangeStep = useCallback(
    (id: string) => {
      if (id === AliasCreateStep.Target && steps[0].status !== StepStatus.VALID) return;
      setStep(id as AliasCreateStep);
    },
    [steps],
  );

  return (
    <Popup onClose={onClose} header={title} portalId="CreateAliasModal" open={isOpen}>
      <div className="flex flex-col gap-y-6 overflow-auto px-6 py-4">
        <Steps
          steps={steps}
          currentStep={step}
          onChangeStep={onChangeStep}
          ariaLabel={title}
          statusLabels={getStepStatusLabels(t)}
        />
        {topSlot}
        <AliasCreateProperties
          step={step}
          entity={alias}
          names={names}
          onChangeEntity={(entity) => setAlias(entity as DialAliasResource)}
        />
      </div>
      <StepperModalButtons
        steps={steps}
        currentStep={steps.find((item) => item.id === step)}
        finishButtonLabel={t(ButtonsI18nKey.Create)}
        onChangeStep={onChangeStep}
        onFinishClick={onCreate}
        onClose={onClose}
      />
    </Popup>
  );
};

export default CreateAliasModal;
