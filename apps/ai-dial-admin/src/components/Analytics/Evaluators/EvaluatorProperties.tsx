'use client';

import { FC } from 'react';

import { DialInput, DialSelectField, DialTextarea } from '@epam/ai-dial-ui-kit';

import EvaluatorParamsEditor from '@/src/components/Analytics/Evaluators/EvaluatorParamsEditor';
import EvaluatorVarsEditor from '@/src/components/Analytics/Evaluators/EvaluatorVarsEditor';
import { EvaluatorFormState } from '@/src/components/Analytics/Evaluators/use-evaluator-form';
import { withStrandedOption } from '@/src/components/Analytics/Evaluators/utils';
import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorPreset, EvaluatorType } from '@/src/models/analytics/evaluator';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  form: EvaluatorFormState;
  isDisabled?: boolean;
}

const EvaluatorProperties: FC<Props> = ({ form, isDisabled }) => {
  const t = useI18n();

  const { draft, onChange } = form;
  const controlClassName = getControlClassName(false);

  // Keyed on sql rather than on llm, so a type the service adds later still shows what the version carries.
  const isSql = draft.type === EvaluatorType.Sql;

  const typeOptions = [
    { value: EvaluatorType.Llm, label: t(AnalyticsEvaluatorsI18nKey.EvaluatorTypeLlm) },
    { value: EvaluatorType.Sql, label: t(AnalyticsEvaluatorsI18nKey.EvaluatorTypeSql) },
  ];

  const presetOptions = [{ value: EvaluatorPreset.ChatCompletion, label: EvaluatorPreset.ChatCompletion }];

  return (
    <div className="flex flex-col gap-y-6">
      <DialInput
        id="evaluator-name"
        labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.Name) }}
        value={draft.name}
        readOnly
        caption={t(AnalyticsEvaluatorsI18nKey.NameReadOnly)}
        containerClassName={controlClassName}
      />

      <DialSelectField
        id="evaluator-type"
        label={t(AnalyticsEvaluatorsI18nKey.Type)}
        options={withStrandedOption(typeOptions, draft.type)}
        value={draft.type}
        disabled={isDisabled}
        containerClassName={controlClassName}
        onChange={(value) => onChange({ type: value as EvaluatorType })}
      />

      {!isSql && (
        <>
          <DialSelectField
            id="evaluator-preset"
            label={t(AnalyticsEvaluatorsI18nKey.Preset)}
            options={withStrandedOption(presetOptions, draft.preset)}
            value={draft.preset ?? ''}
            disabled={isDisabled}
            containerClassName={controlClassName}
            onChange={(value) => onChange({ preset: value as EvaluatorPreset })}
          />

          <DialInput
            id="evaluator-model"
            labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.Model) }}
            value={draft.model ?? ''}
            disabled={isDisabled}
            containerClassName={controlClassName}
            onChange={(v) => onChange({ model: v ?? '' })}
          />

          <section aria-label={t(AnalyticsEvaluatorsI18nKey.SectionParams)} className="flex flex-col gap-2">
            <h2 className="text-primary dial-small">{t(AnalyticsEvaluatorsI18nKey.SectionParams)}</h2>
            <EvaluatorParamsEditor
              params={draft.params ?? {}}
              isDisabled={isDisabled}
              onChange={(params) => onChange({ params })}
            />
          </section>

          <DialTextarea
            id="evaluator-request-template"
            labelProps={{ label: t(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate) }}
            value={draft.request_template ?? ''}
            disabled={isDisabled}
            className="font-mono"
            rows={8}
            spellCheck={false}
            onChange={(value) => onChange({ request_template: value })}
          />

          <section aria-label={t(AnalyticsEvaluatorsI18nKey.SectionInputVars)} className="flex flex-col gap-2">
            <h2 className="text-primary dial-small">{t(AnalyticsEvaluatorsI18nKey.SectionInputVars)}</h2>
            <EvaluatorVarsEditor
              id="evaluator-input-var"
              title={t(AnalyticsEvaluatorsI18nKey.SectionInputVars)}
              vars={draft.input_vars ?? []}
              isDisabled={isDisabled}
              hasExpression
              emptyText={t(AnalyticsEvaluatorsI18nKey.NoInputVars)}
              onChange={(input_vars) => onChange({ input_vars })}
            />
          </section>

          <JsonEditorInput
            elementId="evaluator-response-schema"
            label={t(AnalyticsEvaluatorsI18nKey.SectionResponseSchema)}
            value={draft.response_schema ?? {}}
            disabled={isDisabled}
            inputClassName={controlClassName}
            onChangeValue={(response_schema) =>
              onChange({ response_schema: response_schema as Record<string, unknown> })
            }
          />
        </>
      )}

      <section aria-label={t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)} className="flex flex-col gap-2">
        <h2 className="text-primary dial-small">{t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)}</h2>
        <EvaluatorVarsEditor
          id="evaluator-output-var"
          title={t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)}
          vars={draft.output_vars ?? []}
          isDisabled={isDisabled}
          hasExpression
          emptyText={t(AnalyticsEvaluatorsI18nKey.NoOutputVars)}
          onChange={(output_vars) => onChange({ output_vars })}
        />
        {!form.isValid && !(draft.output_vars ?? []).length && (
          <span className="text-error dial-tiny-text">{t(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)}</span>
        )}
      </section>
    </div>
  );
};

export default EvaluatorProperties;
