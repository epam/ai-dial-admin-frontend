'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo } from 'react';

import PolicySelector from '@/src/components/Assets/Platform/PolicyAssignments/PolicySelector';
import SubjectRulesEditor from '@/src/components/Assets/Platform/PolicySubjects/SubjectRulesEditor';
import IdControl from '@/src/components/BaseControls/Id/Id';
import {
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  PolicyAssignmentsI18nKey,
} from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { getCostObjectFromFolder } from '@/src/utils/policies/path';
import { areRulesValid } from '@/src/utils/policies/subjects';
import { getErrorForName } from '@/src/utils/validation/name-error';

type AssignmentCreateEntity = DialPolicyAssignmentResource & { folderId?: string };

interface Props {
  entity: AssignmentCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
}

/**
 * Create-modal body for an assignment: the ID, the cost object (the folder it is stored in — the saved
 * `costObject` is taken from it, never typed twice), the policy, and the subject rules. Core wants a subject
 * pinned by the policy or by the assignment, and most policies leave it open, so the rules are asked here
 * rather than only on the tab.
 */
const PolicyAssignmentCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const costObject = getCostObjectFromFolder(entity.folderId);
  const costObjectError = useMemo(
    () => (costObject ? getErrorForName(costObject, undefined, t)?.text : t(ErrorI18nKey.EmptyField)),
    [costObject, t],
  );

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'assignment',
      isValid: !costObjectError && !!entity.policy && areRulesValid(entity.subject),
    });
  }, [dispatch, costObjectError, entity.policy, entity.subject]);

  const onChangeCostObject = useCallback(
    (value?: string) => onChangeEntity({ ...entity, folderId: value ? `${value}/` : '' }),
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-col gap-y-8">
      <IdControl
        label={t(EntityFieldsI18nKey.id)}
        placeholder={t(EntityPlaceholdersI18nKey.Id)}
        entity={entity}
        names={names}
        isUniqueNameError={isUniqueNameError}
        onChangeEntity={onChangeEntity}
      />
      <Input
        id="costObjectFolder"
        labelProps={{ label: t(PolicyAssignmentsI18nKey.CostObject), required: true }}
        caption={t(PolicyAssignmentsI18nKey.CostObjectDerived)}
        value={costObject}
        error={costObject ? costObjectError : undefined}
        invalid={!!costObject && !!costObjectError}
        onChange={onChangeCostObject}
      />
      <PolicySelector
        value={entity.policy}
        costObject={costObject}
        className="w-full"
        onChange={(policy) => onChangeEntity({ ...entity, policy })}
      />
      <SubjectRulesEditor rules={entity.subject} onChange={(subject) => onChangeEntity({ ...entity, subject })} />
    </div>
  );
};

export default PolicyAssignmentCreateProperties;
