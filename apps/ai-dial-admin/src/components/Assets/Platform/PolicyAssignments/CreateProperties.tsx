'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo } from 'react';

import PolicySelector from '@/src/components/Assets/Platform/PolicyAssignments/PolicySelector';
import IdControl from '@/src/components/BaseControls/Id/Id';
import {
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  PoliciesI18nKey,
  PolicyAssignmentsI18nKey,
} from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { getCostObjectFromFolder, isPolicyPathElementValid } from '@/src/utils/policies/path';
import { getErrorForName } from '@/src/utils/validation/name-error';

type AssignmentCreateEntity = DialPolicyAssignmentResource & { folderId?: string };

interface Props {
  entity: AssignmentCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  isCostObjectLocked?: boolean;
  onChangeEntity: (entity: object) => void;
}

/** Details for the first step; the assignment's cost object is taken from its folder. */
const PolicyAssignmentCreateProperties: FC<Props> = ({
  entity,
  names,
  isUniqueNameError,
  isCostObjectLocked,
  onChangeEntity,
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const costObject = getCostObjectFromFolder(entity.folderId);
  const costObjectError = useMemo(() => {
    if (!costObject) return t(ErrorI18nKey.EmptyField);
    return (
      getErrorForName(costObject, undefined, t)?.text ||
      (isPolicyPathElementValid(costObject) ? undefined : t(PoliciesI18nKey.InvalidPathElement))
    );
  }, [costObject, t]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'assignment',
      isValid: !costObjectError && !!entity.policy?.trim(),
    });
  }, [dispatch, costObjectError, entity.policy]);

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
        externalError={
          entity.name && !isPolicyPathElementValid(entity.name) ? t(PoliciesI18nKey.InvalidPathElement) : undefined
        }
        onChangeEntity={onChangeEntity}
      />
      <Input
        id="costObjectFolder"
        labelProps={{ label: t(PolicyAssignmentsI18nKey.CostObject), required: true }}
        caption={t(PolicyAssignmentsI18nKey.CostObjectDerived)}
        value={costObject}
        disabled={isCostObjectLocked}
        error={costObjectError}
        invalid={!!costObjectError}
        onChange={onChangeCostObject}
      />
      <PolicySelector
        value={entity.policy}
        error={entity.policy?.trim() ? undefined : t(ErrorI18nKey.EmptyField)}
        costObject={costObject}
        className="w-full"
        onChange={(policy) => onChangeEntity({ ...entity, policy })}
      />
    </div>
  );
};

export default PolicyAssignmentCreateProperties;
