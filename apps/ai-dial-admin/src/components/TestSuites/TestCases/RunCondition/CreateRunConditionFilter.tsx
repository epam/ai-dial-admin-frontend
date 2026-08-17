'use client';

import { DialGhostButton, DialInput, DialSelectField, ElementSize, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconPlus, IconX } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo } from 'react';

import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import { BasicI18nKey, ButtonsI18nKey, QueryBuilderI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import { RUN_CONDITION_LOGICAL_OPTIONS } from './constants';
import {
  RunConditionFieldOption,
  RunConditionFilter,
  RunConditionLogicalOp,
  RunConditionOperator,
  RunConditionPredicate,
} from './models';
import { getRunConditionOperatorOptions, sanitizeRunConditionOperator } from './utils';

interface Props {
  draft: RunConditionFilter;
  fieldOptions: RunConditionFieldOption[];
  onChange: (filter: RunConditionFilter) => void;
  onClear: () => void;
}

const FIELD_COL = 'w-[120px] shrink-0';
const OPERATOR_COL = 'w-[168px] shrink-0';
const VALUE_COL = 'w-[192px] shrink-0';
const ACTION_COL = 'w-6 shrink-0 flex items-center justify-center';

const CreateRunConditionFilter: FC<Props> = ({ draft, fieldOptions, onChange, onClear }) => {
  const t = useI18n();

  const fieldSelectOptions: SelectOption[] = useMemo(
    () => fieldOptions.map((o) => ({ value: o.field, label: o.displayName })),
    [fieldOptions],
  );

  const operatorOptions: SelectOption[] = useMemo(
    () =>
      getRunConditionOperatorOptions(draft.isArray).map((o) => ({
        value: o.value,
        label: t(o.label),
        iconBefore: o.icon,
      })),
    [draft.isArray, t],
  );

  const logicalOptions: SelectOption[] = useMemo(
    () =>
      RUN_CONDITION_LOGICAL_OPTIONS.map((o) => ({
        value: o.value,
        label: o.value === RunConditionLogicalOp.And ? t(BasicI18nKey.And) : t(BasicI18nKey.Or),
      })),
    [t],
  );

  useEffect(() => {
    if (!draft.isArray) {
      return;
    }
    const predicates = draft.predicates.map((p) => ({
      ...p,
      operator: sanitizeRunConditionOperator(p.operator),
    }));
    const hasInvalidOperator = predicates.some((p, i) => p.operator !== draft.predicates[i]?.operator);
    if (hasInvalidOperator) {
      onChange({ ...draft, predicates });
    }
  }, [draft, onChange]);

  const onFieldChange = useCallback(
    (field: string) => {
      const option = fieldOptions.find((o) => o.field === field);
      if (!option) return;
      const predicates = option.isArray
        ? draft.predicates.map((p) => ({
            ...p,
            operator: sanitizeRunConditionOperator(p.operator),
          }))
        : [
            {
              operator: draft.predicates[0]?.operator ?? RunConditionOperator.Contain,
              value: draft.predicates[0]?.value ?? '',
            },
          ];
      onChange({
        ...draft,
        field: option.field,
        displayName: option.displayName,
        isArray: option.isArray,
        predicates,
      });
    },
    [draft, fieldOptions, onChange],
  );

  const onPredicateChange = useCallback(
    (index: number, patch: Partial<RunConditionPredicate>) => {
      const predicates = draft.predicates.map((p, i) => (i === index ? { ...p, ...patch } : p));
      onChange({ ...draft, predicates });
    },
    [draft, onChange],
  );

  const onRemovePredicate = useCallback(
    (index: number) => {
      if (draft.predicates.length <= 1) {
        onClear();
        return;
      }
      onChange({ ...draft, predicates: draft.predicates.filter((_, i) => i !== index) });
    },
    [draft, onChange, onClear],
  );

  const onAddPredicate = useCallback(() => {
    onChange({
      ...draft,
      predicates: [...draft.predicates, { operator: RunConditionOperator.Contain, value: '' }],
    });
  }, [draft, onChange]);

  const firstPredicate = draft.predicates[0];

  return (
    <div className="flex flex-col gap-2 bg-layer-0 rounded p-2 z-50 shadow">
      <div className="flex items-center gap-2">
        <div className={FIELD_COL}>
          <DialSelectField
            id="run-condition-field"
            value={draft.field || undefined}
            options={fieldSelectOptions}
            placeholder={t(TestSuitesI18nKey.RunConditionSelect)}
            onChange={(v) => onFieldChange(String(v))}
          />
        </div>
        {firstPredicate ? (
          <>
            <div className={OPERATOR_COL}>
              <DialSelectField
                id="operator-0"
                value={firstPredicate.operator}
                options={operatorOptions}
                onChange={(v) => onPredicateChange(0, { operator: v as RunConditionOperator })}
              />
            </div>
            <div className={VALUE_COL}>
              <DialInput
                id="value-0"
                value={firstPredicate.value}
                placeholder={t(BasicI18nKey.Value)}
                onChange={(v) => onPredicateChange(0, { value: v || '' })}
                className="py-[9px]"
              />
            </div>
          </>
        ) : null}
        <div className={ACTION_COL}>
          <button
            type="button"
            aria-label={t(ButtonsI18nKey.Delete)}
            className="hover:text-accent-primary"
            onClick={() => {
              onRemovePredicate(0);
            }}
          >
            <IconX height={16} width={16} />
          </button>
        </div>
      </div>

      {draft.isArray
        ? draft.predicates.slice(1).map((predicate, i) => (
            <div key={i + 1} className="flex items-center gap-2">
              <div className={`${FIELD_COL} flex justify-end`}>
                {i === 0 ? (
                  <div className="w-[60px]">
                    <CompactSelect
                      ariaLabel={t(QueryBuilderI18nKey.Operator)}
                      options={logicalOptions}
                      value={draft.logicalOp}
                      onChange={(v) => onChange({ ...draft, logicalOp: v as RunConditionLogicalOp })}
                    />
                  </div>
                ) : null}
              </div>
              <div className={OPERATOR_COL}>
                <DialSelectField
                  id={`operator-${i + 1}`}
                  value={predicate.operator}
                  options={operatorOptions}
                  onChange={(v) => onPredicateChange(i + 1, { operator: v as RunConditionOperator })}
                />
              </div>
              <div className={VALUE_COL}>
                <DialInput
                  id={`value-${i + 1}`}
                  value={predicate.value}
                  placeholder={t(BasicI18nKey.Value)}
                  onChange={(v) => onPredicateChange(i + 1, { value: v || '' })}
                  className="py-[9px]"
                />
              </div>
              <div className={ACTION_COL}>
                <button
                  type="button"
                  aria-label={t(ButtonsI18nKey.Delete)}
                  className="hover:text-accent-primary"
                  onClick={() => {
                    onRemovePredicate(i + 1);
                  }}
                >
                  <IconX height={16} width={16} />
                </button>
              </div>
            </div>
          ))
        : null}

      {draft.isArray ? (
        <div className="flex items-center gap-2">
          <div className={FIELD_COL} />
          <div className={OPERATOR_COL}>
            <DialGhostButton
              label={t(ButtonsI18nKey.Add)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onAddPredicate}
              size={ElementSize.Small}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CreateRunConditionFilter;
