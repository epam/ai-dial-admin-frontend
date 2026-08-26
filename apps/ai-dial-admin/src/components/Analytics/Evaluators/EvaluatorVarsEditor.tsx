'use client';

import { FC } from 'react';

import { DialGhostButton, DialGhostIconButton, DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { EVALUATOR_VAR_TYPES } from '@/src/constants/analytics/evaluators';
import { AnalyticsEvaluatorsI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EvaluatorVar } from '@/src/models/analytics/evaluator';
import { withStrandedOption } from '@/src/components/Analytics/Evaluators/utils';
import { getVarExpression } from '@/src/utils/analytics/evaluator-dto';

interface Props {
  id: string;
  title: string;
  vars: EvaluatorVar[];
  isDisabled?: boolean;
  hasExpression?: boolean;
  emptyText: string;
  onChange: (vars: EvaluatorVar[]) => void;
}

const typeOptions = EVALUATOR_VAR_TYPES.map((type) => ({ value: type, label: type }));

const EvaluatorVarsEditor: FC<Props> = ({ id, title, vars, isDisabled, hasExpression, emptyText, onChange }) => {
  const t = useI18n();

  const onChangeRow = (index: number, patch: Partial<EvaluatorVar>) =>
    onChange(vars.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const onChangeExpression = (index: number, value: string) => {
    const current = vars[index];
    onChangeRow(index, current.sql !== undefined ? { sql: value } : { jsonata: value });
  };

  const onRemove = (index: number) => onChange(vars.filter((_, i) => i !== index));

  const onAdd = () => onChange([...vars, { name: '', type: EVALUATOR_VAR_TYPES[0] }]);

  return (
    <div className="flex flex-col gap-2">
      {!vars.length && <span className="text-secondary dial-small">{emptyText}</span>}

      {vars.map((item, index) => (
        // The row carries the accessible name for the type select, which cannot take one of its own —
        // the same shape OutputBindingsEditor uses when labels appear only over the first row.
        <div key={index} role="group" aria-label={`${title} ${index + 1}`} className="flex flex-row items-end gap-3">
          <DialInput
            id={`${id}-name-${index}`}
            labelProps={index === 0 ? { label: t(AnalyticsEvaluatorsI18nKey.VarName) } : undefined}
            aria-label={`${t(AnalyticsEvaluatorsI18nKey.VarName)} ${index + 1}`}
            value={item.name}
            disabled={isDisabled}
            containerClassName="max-w-[220px]"
            onChange={(v) => onChangeRow(index, { name: v ?? '' })}
          />
          <DialSelectField
            id={`${id}-type-${index}`}
            label={index === 0 ? t(AnalyticsEvaluatorsI18nKey.VarType) : undefined}
            options={withStrandedOption(typeOptions, item.type)}
            value={item.type}
            disabled={isDisabled}
            containerClassName="max-w-[140px]"
            onChange={(value) => onChangeRow(index, { type: value as string })}
          />
          {hasExpression && (
            <DialInput
              id={`${id}-expression-${index}`}
              labelProps={index === 0 ? { label: t(AnalyticsEvaluatorsI18nKey.VarExpression) } : undefined}
              aria-label={`${t(AnalyticsEvaluatorsI18nKey.VarExpression)} ${index + 1}`}
              value={getVarExpression(item)}
              disabled={isDisabled}
              containerClassName="flex-1"
              onChange={(v) => onChangeExpression(index, v ?? '')}
            />
          )}
          <DialGhostIconButton
            icon={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            aria-label={`${t(ButtonsI18nKey.Delete)} ${item.name || index + 1}`}
            disabled={isDisabled}
            onClick={() => onRemove(index)}
          />
        </div>
      ))}

      <DialGhostButton
        className="self-start"
        label={t(AnalyticsEvaluatorsI18nKey.AddVariable)}
        disabled={isDisabled}
        onClick={onAdd}
      />
    </div>
  );
};

export default EvaluatorVarsEditor;
