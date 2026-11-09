'use client';

import { Input } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo } from 'react';

import BudgetFields from '@/src/components/Assets/Platform/Policies/BudgetFields';
import IdControl from '@/src/components/BaseControls/Id/Id';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, PoliciesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';
import { getCostObjectFromFolder, isPolicyPathElementValid } from '@/src/utils/policies/path';
import { getPolicyFormErrors } from '@/src/utils/policies/validation';
import { getErrorForName } from '@/src/utils/validation/name-error';

type PolicyCreateEntity = DialPolicyResource & { folderId?: string };

interface Props {
  entity: PolicyCreateEntity;
  names: string[];
  isUniqueNameError?: boolean;
  onChangeEntity: (entity: object) => void;
}

/** Details for the first step; the cost object selects the policy's folder. */
const PolicyCreateProperties: FC<Props> = ({ entity, names, isUniqueNameError, onChangeEntity }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const costObject = getCostObjectFromFolder(entity.folderId);
  const costObjectError = useMemo(() => {
    if (!costObject) return undefined;
    return (
      getErrorForName(costObject, undefined, t)?.text ||
      (isPolicyPathElementValid(costObject) ? undefined : t(PoliciesI18nKey.InvalidPathElement))
    );
  }, [costObject, t]);

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'policy',
      isValid: Object.keys(getPolicyFormErrors(entity)).length === 0 && !costObjectError,
    });
  }, [dispatch, entity, costObjectError]);

  const onChangeCostObject = useCallback(
    (value?: string) => {
      // Tree-node form (`team-a/`) for a cost object; the platform root for a global policy.
      const folder = value ? `${value}/` : `${PLATFORM_ROOT_FOLDER}/`;
      onChangeEntity({ ...entity, folderId: folder });
    },
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
        labelProps={{ label: t(PoliciesI18nKey.CostObject) }}
        caption={t(PoliciesI18nKey.CreateCostObjectHint)}
        value={costObject}
        error={costObjectError}
        invalid={!!costObjectError}
        onChange={onChangeCostObject}
      />
      <BudgetFields policy={entity} controlClassName="w-full" onChange={onChangeEntity} />
    </div>
  );
};

export default PolicyCreateProperties;
