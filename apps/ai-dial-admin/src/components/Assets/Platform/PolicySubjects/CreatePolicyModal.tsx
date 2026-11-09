'use client';

import { Popup } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import PolicyCreateProperties from '@/src/components/Assets/Platform/Policies/CreateProperties';
import { NEW_POLICY_DEFAULTS } from '@/src/components/Assets/Platform/Policies/constants';
import PolicyAssignmentCreateProperties from '@/src/components/Assets/Platform/PolicyAssignments/CreateProperties';
import { PolicyCreateStep } from '@/src/components/Assets/Platform/PolicySubjects/constants';
import { PolicyCreateDraft } from '@/src/components/Assets/Platform/PolicySubjects/models';
import SubjectRulesEditor from '@/src/components/Assets/Platform/PolicySubjects/SubjectRulesEditor';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { PolicySubjectRule } from '@/src/models/dial/policy';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { getCostObjectFromFolder, isPolicyPathElementValid } from '@/src/utils/policies/path';
import { areRulesValid } from '@/src/utils/policies/subjects';
import { getPolicyFormErrors } from '@/src/utils/policies/validation';
import { getErrorForName } from '@/src/utils/validation/name-error';

interface Props {
  route: ApplicationRoute;
  isOpen: boolean;
  names: string[];
  getContext: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
  onCreate?: (asset: AssetWithVersion) => Promise<ServerActionResponse>;
}

const CreatePolicyModal: FC<Props> = ({ route, isOpen, names, getContext, onClose, onCreate }) => {
  const t = useI18n();
  const router = useRouter();
  const folderContext = getContext();
  const { isValid } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const protectedRequest = useProtectedRequest();
  const isPolicy = route === ApplicationRoute.PlatformPolicies;
  const [step, setStep] = useState(PolicyCreateStep.Details);
  const [draft, setDraft] = useState<PolicyCreateDraft>(() => ({
    name: '',
    ...(isPolicy ? NEW_POLICY_DEFAULTS : {}),
    folderId: folderContext.filePath,
  }));
  const [isCostObjectLocked] = useState(() => !!getCostObjectFromFolder(folderContext.filePath));
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const hasChangedStep = useRef(false);
  const detailsHeadingRef = useRef<HTMLHeadingElement>(null);
  const subjectsHeadingRef = useRef<HTMLHeadingElement>(null);
  const isSubjectsStep = step === PolicyCreateStep.Subjects;
  const costObject = getCostObjectFromFolder(draft.folderId);
  const isNameValid = !getErrorForName(draft.name, names, t) && isPolicyPathElementValid(draft.name);
  const isCostObjectValid =
    !costObject || (!getErrorForName(costObject, undefined, t) && isPolicyPathElementValid(costObject));
  const isDetailsValid =
    isValid &&
    isNameValid &&
    isCostObjectValid &&
    (isPolicy ? Object.keys(getPolicyFormErrors(draft)).length === 0 : !!costObject && !!draft.policy?.trim());

  useEffect(() => {
    if (!hasChangedStep.current) return;
    if (isSubjectsStep) subjectsHeadingRef.current?.focus();
    else detailsHeadingRef.current?.focus();
  }, [isSubjectsStep]);

  const onChangeDraft = useCallback((value: object) => setDraft(value as PolicyCreateDraft), []);
  const onChangeSubjects = useCallback((subject?: PolicySubjectRule[]) => {
    setDraft((current) => ({ ...current, subject }));
  }, []);
  const onNext = useCallback(() => {
    if (!isDetailsValid) return;
    hasChangedStep.current = true;
    setStep(PolicyCreateStep.Subjects);
  }, [isDetailsValid]);
  const onBack = useCallback(() => {
    hasChangedStep.current = true;
    setStep(PolicyCreateStep.Details);
  }, []);

  const onSubmit = useCallback(async () => {
    if (!isDetailsValid || !areRulesValid(draft.subject) || isCreatingRef.current) return;
    isCreatingRef.current = true;
    setIsCreating(true);
    const entity: PolicyCreateDraft = {
      ...draft,
      name: draft.name.trim(),
      ...(isPolicy && { costObject: draft.subject?.length ? costObject || undefined : undefined }),
    };
    try {
      const res = await protectedRequest(onCreate, entity as unknown as AssetWithVersion);
      if (!res.success) {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        return;
      }
      showNotification(
        getSuccessNotification(
          getCreateNotificationTitle(route, t),
          getCreateNotificationDescription(route, entity.name, t),
        ),
      );
      const createdEntity = res.response
        ? { ...entity, ...res.response, name: res.response._metadata?.name || res.response.name || entity.name }
        : entity;
      router.push(getUrnForEntity(route, createdEntity));
      onClose();
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [
    isDetailsValid,
    draft,
    isPolicy,
    costObject,
    protectedRequest,
    onCreate,
    showNotification,
    route,
    t,
    router,
    onClose,
  ]);

  return (
    <Popup
      open={isOpen}
      header={getCreateEntityTitle(route, t)}
      portalId="CreatePolicy"
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(isSubjectsStep ? ButtonsI18nKey.Back : ButtonsI18nKey.Cancel),
        submitLabel: t(isSubjectsStep ? ButtonsI18nKey.Create : ButtonsI18nKey.Next),
        isSubmitDisabled: isCreating || !isDetailsValid || (isSubjectsStep && !areRulesValid(draft.subject)),
        onCancel: isSubjectsStep ? onBack : onClose,
        onSubmit: isSubjectsStep ? onSubmit : onNext,
      })}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <div hidden={isSubjectsStep}>
          <h2 ref={detailsHeadingRef} tabIndex={-1} className="sr-only">
            {t(TabsI18nKey.Properties)}
          </h2>
          {isPolicy ? (
            <PolicyCreateProperties entity={draft} names={names} onChangeEntity={onChangeDraft} />
          ) : (
            <PolicyAssignmentCreateProperties
              entity={draft}
              names={names}
              isCostObjectLocked={isCostObjectLocked}
              onChangeEntity={onChangeDraft}
            />
          )}
        </div>
        {isSubjectsStep && (
          <div>
            <h2 ref={subjectsHeadingRef} tabIndex={-1} className="mb-4">
              {t(TabsI18nKey.Subjects)}
            </h2>
            <SubjectRulesEditor rules={draft.subject} onChange={onChangeSubjects} />
          </div>
        )}
      </div>
    </Popup>
  );
};

export default CreatePolicyModal;
