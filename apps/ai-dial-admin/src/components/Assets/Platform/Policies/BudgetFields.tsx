'use client';

import {
  NumberInput,
  RadioButtonWithContent,
  RadioGroup,
  RadioGroupOrientation,
  Select,
  TagInput,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import { POLICY_KIND_OPTIONS, POLICY_QUANTITY_OPTIONS } from '@/src/components/Assets/Platform/Policies/constants';
import { PoliciesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { PolicyKind, PolicyQuantity } from '@/src/models/dial/policy';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { toRadioItems } from '@/src/utils/radio-items';
import { getPolicyFormErrors, POLICY_OBJECT_ALL } from '@/src/utils/policies/validation';

interface Props {
  policy: DialPolicyResource;
  /** Shows each field's error from the start, instead of waiting for the user to touch it. */
  isValidationShown?: boolean;
  controlClassName?: string;
  onChange: (policy: DialPolicyResource) => void;
}

const toAmount = (value?: number | string): number | undefined =>
  value == null || value === '' ? undefined : Number(value);

/** What a budget covers and how much it allows: the fields both the create modal and the details form need. */
const BudgetFields: FC<Props> = ({ policy, isValidationShown = true, controlClassName, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const errors = isValidationShown ? getPolicyFormErrors(policy) : {};
  const isObjectAll = !Array.isArray(policy.object);

  const objectRadio: RadioButtonWithContent[] = [
    { id: 'all', name: t(PoliciesI18nKey.ObjectAll) },
    { id: 'list', name: t(PoliciesI18nKey.ObjectList) },
  ];

  const onChangePriority = useCallback(
    (value?: number | string) => onChange({ ...policy, priority: toAmount(value) }),
    [onChange, policy],
  );

  const onChangeObjectMode = useCallback(
    (mode: string) => onChange({ ...policy, object: mode === 'all' ? POLICY_OBJECT_ALL : [] }),
    [onChange, policy],
  );

  const onChangeDeployments = useCallback(
    (deployments: string[]) => onChange({ ...policy, object: deployments }),
    [onChange, policy],
  );

  const onChangeCost = useCallback(
    (window: 'day' | 'month', value?: number | string) =>
      onChange({ ...policy, cost: { ...policy.cost, [window]: toAmount(value) } }),
    [onChange, policy],
  );

  return (
    <>
      <NumberInput
        id="priority"
        integer
        containerClassName={controlClassName}
        labelProps={{ label: t(PoliciesI18nKey.Priority), required: true }}
        value={policy.priority}
        disabled={isReadOnlyAdmin}
        error={errors.priority ? t(errors.priority) : undefined}
        invalid={!!errors.priority}
        onChange={onChangePriority}
      />
      <Select
        id="kind"
        labelProps={{ label: t(PoliciesI18nKey.Kind), required: true }}
        options={POLICY_KIND_OPTIONS}
        value={policy.kind ?? PolicyKind.BUDGET}
        className={controlClassName}
        disabled={isReadOnlyAdmin}
        onChange={(kind) => onChange({ ...policy, kind: kind as PolicyKind })}
      />
      <Select
        id="quantity"
        labelProps={{ label: t(PoliciesI18nKey.Quantity), required: true }}
        options={POLICY_QUANTITY_OPTIONS}
        value={policy.quantity ?? PolicyQuantity.COST}
        className={controlClassName}
        disabled={isReadOnlyAdmin}
        onChange={(quantity) => onChange({ ...policy, quantity: quantity as PolicyQuantity })}
      />
      <RadioGroup
        id="object-mode"
        items={toRadioItems(objectRadio)}
        value={isObjectAll ? 'all' : 'list'}
        disabled={isReadOnlyAdmin}
        labelProps={{ label: t(PoliciesI18nKey.Object), required: true }}
        orientation={RadioGroupOrientation.Row}
        onChange={onChangeObjectMode}
      />
      {!isObjectAll && (
        <TagInput
          id="object-deployments"
          className={controlClassName}
          tagClassName="h-6 rounded-md border border-secondary bg-layer-sunken"
          labelProps={{ label: t(PoliciesI18nKey.ObjectDeployments), required: true }}
          value={policy.object as string[]}
          disabled={isReadOnlyAdmin}
          error={errors.object ? t(errors.object) : undefined}
          invalid={!!errors.object}
          onChange={onChangeDeployments}
        />
      )}
      <div className={controlClassName} role="group" aria-label={t(PoliciesI18nKey.Cost)}>
        <div className="flex flex-row gap-x-2">
          <NumberInput
            id="cost-day"
            containerClassName="flex-1"
            labelProps={{ label: t(PoliciesI18nKey.CostPerDay) }}
            value={policy.cost?.day}
            min={0}
            disabled={isReadOnlyAdmin}
            error={errors.costDay ? t(errors.costDay) : undefined}
            invalid={!!errors.costDay || !!errors.costWindow}
            onChange={(value) => onChangeCost('day', value)}
          />
          <NumberInput
            id="cost-month"
            containerClassName="flex-1"
            labelProps={{ label: t(PoliciesI18nKey.CostPerMonth) }}
            value={policy.cost?.month}
            min={0}
            disabled={isReadOnlyAdmin}
            error={errors.costMonth ? t(errors.costMonth) : undefined}
            invalid={!!errors.costMonth || !!errors.costWindow}
            onChange={(value) => onChangeCost('month', value)}
          />
        </div>
        {errors.costWindow && (
          <p role="alert" className="dial-tiny-text text-error mt-1">
            {t(errors.costWindow)}
          </p>
        )}
      </div>
    </>
  );
};

export default BudgetFields;
