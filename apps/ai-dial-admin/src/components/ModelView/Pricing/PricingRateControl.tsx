'use client';

import { useCallback, useMemo } from 'react';

import {
  DialGhostIconButton,
  DialInput,
  DialLabel,
  DialSelectField,
  ElementSize,
  SelectOption,
} from '@epam/ai-dial-ui-kit';
import { IconBinaryTree2 } from '@tabler/icons-react';

import PriceControl from '@/src/components/BaseControls/Price';
import SingleValueAutocomplete from '@/src/components/Common/SingleValueAutocomplete/SingleValueAutocomplete';
import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PricingOperator, PricingRate, PricingRateNode } from '@/src/models/dial/model';

import { ORDERING_OPERATORS, STANDARD_USAGE_FIELDS } from './constants';

interface Props {
  elementId: string;
  label: string;
  value: PricingRate | undefined;
  disabled?: boolean;
  onChange: (value: PricingRate | undefined) => void;
}

// Works in display units (per-million under the token unit): Pricing scales the whole tree at the
// boundary, so no recursion level re-applies the transform.
const PricingRateControl = ({ elementId, label, value, disabled, onChange }: Props) => {
  const t = useI18n();
  const node = typeof value === 'object' ? value : undefined;

  const fieldOptions = useMemo(
    () => STANDARD_USAGE_FIELDS.map((field) => ({ label: field.field, value: field.field })),
    [],
  );

  // Core rejects an ordering operator against a string-typed standard field at config load, so those
  // operators never become selectable in the first place.
  const operatorOptions: SelectOption[] = useMemo(() => {
    const isStringField = STANDARD_USAGE_FIELDS.find((f) => f.field === node?.test.field)?.isNumeric === false;
    return Object.values(PricingOperator)
      .filter((op) => !(isStringField && ORDERING_OPERATORS.includes(op)))
      .map((op) => ({ value: op, label: op }));
  }, [node?.test.field]);

  const onToggleConditional = useCallback(() => {
    if (node) {
      // Collapsing keeps the if-true rate when it is flat, so the value that survives stays visible.
      onChange(typeof node.ifTrue === 'string' ? node.ifTrue : '');
    } else {
      // Seeding both branches with the current rate keeps billing semantics unchanged until the user
      // edits something; seeding only if-true would silently reprice the false path.
      onChange({
        test: { field: '', operator: PricingOperator.EQ, value: '' },
        ifTrue: value ?? '',
        ifFalse: value ?? '',
      });
    }
  }, [node, onChange, value]);

  const onChangeFlat = useCallback((rate?: number | string) => onChange(rate == null ? '' : String(rate)), [onChange]);

  const updateNode = useCallback(
    (patch: Partial<PricingRateNode>) => {
      if (node) {
        onChange({ ...node, ...patch });
      }
    },
    [node, onChange],
  );

  const onChangeField = useCallback(
    (field: string) => {
      if (!node) return;
      const isStringField = STANDARD_USAGE_FIELDS.find((f) => f.field === field)?.isNumeric === false;
      const operator =
        isStringField && ORDERING_OPERATORS.includes(node.test.operator) ? PricingOperator.EQ : node.test.operator;
      updateNode({ test: { ...node.test, field, operator } });
    },
    [node, updateNode],
  );

  const onChangeOperator = useCallback(
    (operator: string) => {
      if (!node) return;
      updateNode({ test: { ...node.test, operator: operator as PricingOperator } });
    },
    [node, updateNode],
  );

  const onChangeTestValue = useCallback(
    (testValue?: string) => {
      if (!node) return;
      updateNode({ test: { ...node.test, value: testValue ?? '' } });
    },
    [node, updateNode],
  );

  const onChangeIfTrue = useCallback((next: PricingRate | undefined) => updateNode({ ifTrue: next }), [updateNode]);
  const onChangeIfFalse = useCallback((next: PricingRate | undefined) => updateNode({ ifFalse: next }), [updateNode]);

  const flatValue = typeof value === 'string' ? value : '';

  if (!node) {
    return (
      <div className="flex items-end gap-x-2">
        <PriceControl
          elementId={elementId}
          label={label}
          value={flatValue}
          onChange={onChangeFlat}
          containerClassName="w-[120px]"
          disabled={disabled}
        />
        {!disabled && (
          <div className="h-10 flex items-center">
            <DialGhostIconButton
              size={ElementSize.Small}
              icon={<IconBinaryTree2 size={16} aria-hidden />}
              aria-pressed={false}
              aria-label={t(ModelViewI18nKey.ConfigureConditional)}
              onClick={onToggleConditional}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div role="group" aria-label={`${label} ${t(ModelViewI18nKey.ConditionalRate)}`} className="flex flex-col gap-y-2">
      <div className="flex items-center gap-x-2">
        <DialLabel label={` ${label} · ${t(ModelViewI18nKey.ConditionalRate)}`} />
        {!disabled && (
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconBinaryTree2 size={16} aria-hidden />}
            aria-pressed
            aria-label={t(ModelViewI18nKey.UseFlatRate)}
            onClick={onToggleConditional}
          />
        )}
      </div>

      <div className="flex items-start gap-x-2">
        <SingleValueAutocomplete
          elementId={`${elementId}-field`}
          label={t(ModelViewI18nKey.Field)}
          value={node.test.field}
          availableItems={fieldOptions}
          placeholder={t(ModelViewI18nKey.FieldPlaceholder)}
          disabled={disabled}
          onChange={onChangeField}
        />
        <DialSelectField
          value={node.test.operator}
          id={`${elementId}-operator`}
          options={operatorOptions}
          className="w-[80px]"
          containerClassName="w-[80px]"
          label={t(ModelViewI18nKey.Operator)}
          onChange={(operator) => onChangeOperator(operator as string)}
          disabled={disabled}
        />
        <DialInput
          id={`${elementId}-value`}
          value={node.test.value}
          labelProps={{ label: t(BasicI18nKey.Value) }}
          containerClassName="w-[120px]"
          disabled={disabled}
          onChange={onChangeTestValue}
        />
      </div>

      <div className="flex flex-col gap-y-2 pl-4 border-l border-primary">
        <PricingRateControl
          elementId={`${elementId}-if-true`}
          label={t(ModelViewI18nKey.IfTrue)}
          value={node.ifTrue}
          disabled={disabled}
          onChange={onChangeIfTrue}
        />
        <PricingRateControl
          elementId={`${elementId}-if-false`}
          label={t(ModelViewI18nKey.IfFalse)}
          value={node.ifFalse}
          disabled={disabled}
          onChange={onChangeIfFalse}
        />
      </div>
    </div>
  );
};

export default PricingRateControl;
