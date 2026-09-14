'use client';

import { FC, useMemo } from 'react';

import { DialInput, DialLabel, DialSelectField, DialTextarea, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import EvaluatorParamsEditor from '@/src/components/Analytics/Evaluators/EvaluatorParamsEditor';
import OutputsEditor from '@/src/components/Analytics/Evaluators/OutputsEditor';
import { EvaluatorFormState } from '@/src/components/Analytics/Evaluators/use-evaluator-form';
import { withStrandedOption } from '@/src/components/Analytics/Evaluators/utils';
import PlaceholderTokens from '@/src/components/Analytics/Common/PlaceholderTokens';
import Accordion from '@/src/components/Common/Accordion/Accordion';
import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import { MEMBERS_PLACEHOLDER, MEMBER_BUILT_IN_PLACEHOLDERS } from '@/src/constants/analytics/pipelines';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { PlaceholderState, PlaceholderToken } from '@/src/models/analytics/pipeline-ui';
import { extractPlaceholders } from '@/src/utils/analytics/template-placeholders';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  form: EvaluatorFormState;
  isDisabled?: boolean;
}

// The service accepts the template whether or not it parses, so a stored value that does not is edited
// as text rather than refused — refusing it would leave a live version uneditable here.
const asJsonObject = (template?: string): object | null => {
  if (!template) return {};

  try {
    const parsed: unknown = JSON.parse(template);
    return typeof parsed === 'object' && parsed !== null ? (parsed as object) : null;
  } catch {
    return null;
  }
};

const LABEL_ICON_SIZE = 14;

const PLACEHOLDER_DESCRIPTION: Record<string, AnalyticsEvaluatorsI18nKey> = {
  members: AnalyticsEvaluatorsI18nKey.PlaceholderMembers,
  members_included: AnalyticsEvaluatorsI18nKey.PlaceholderMembersIncluded,
  members_omitted: AnalyticsEvaluatorsI18nKey.PlaceholderMembersOmitted,
  members_truncated: AnalyticsEvaluatorsI18nKey.PlaceholderMembersTruncated,
  members_notice: AnalyticsEvaluatorsI18nKey.PlaceholderMembersNotice,
};

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

  const templateObject = useMemo(() => asJsonObject(draft.request_template), [draft.request_template]);

  const referenced = useMemo(() => extractPlaceholders(draft.request_template), [draft.request_template]);

  const isMembersMissing = !referenced.includes(MEMBERS_PLACEHOLDER);

  // Reference, not validation: registration never reads the template, and whether `{{members}}` is
  // required — or refused — depends on the trigger of a pipeline this form cannot see. The pipeline form
  // states it where the trigger is known.
  const memberTokens: PlaceholderToken[] = MEMBER_BUILT_IN_PLACEHOLDERS.map((name) => ({
    name,
    state: referenced.includes(name) ? PlaceholderState.Covered : PlaceholderState.Available,
    description: t(PLACEHOLDER_DESCRIPTION[name] ?? AnalyticsEvaluatorsI18nKey.PlaceholderMembers),
  }));

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
            <span className="text-secondary dial-tiny-text">{t(AnalyticsEvaluatorsI18nKey.ParamsHint)}</span>
            <EvaluatorParamsEditor
              params={draft.params ?? {}}
              isDisabled={isDisabled}
              onChange={(params) => onChange({ params })}
            />
          </section>

          <section aria-label={t(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)} className="flex flex-col gap-2">
            <DialLabel
              htmlFor="evaluator-request-template"
              label={
                <span className="flex flex-row items-center gap-1">
                  {t(AnalyticsEvaluatorsI18nKey.SectionRequestTemplate)}
                  <DialTooltip tooltip={t(AnalyticsEvaluatorsI18nKey.TemplatePlaceholders)}>
                    {/* Sized to the label rather than to a button: it sits in the text, not beside it. */}
                    <IconInfoCircle size={LABEL_ICON_SIZE} stroke={2} className="text-secondary" />
                  </DialTooltip>
                </span>
              }
            />

            <PlaceholderTokens tokens={memberTokens} label={t(AnalyticsEvaluatorsI18nKey.TemplatePlaceholders)} />

            {templateObject ? (
              <JsonEditorInput
                elementId="evaluator-request-template"
                value={templateObject}
                disabled={isDisabled}
                inputClassName={controlClassName}
                onChangeValue={(value) => onChange({ request_template: JSON.stringify(value) })}
              />
            ) : (
              <DialTextarea
                id="evaluator-request-template"
                value={draft.request_template ?? ''}
                disabled={isDisabled}
                caption={t(AnalyticsEvaluatorsI18nKey.TemplateNotJson)}
                className="font-mono"
                rows={8}
                spellCheck={false}
                onChange={(value) => onChange({ request_template: value })}
              />
            )}

            {/* Not an error: registration never reads the template, and whether `{{members}}` is required
                depends on the trigger of a pipeline this form knows nothing about. */}
            {isMembersMissing && (
              <span className="text-secondary dial-tiny-text">
                {t(AnalyticsEvaluatorsI18nKey.TemplatePlaceholdersCaption)}
              </span>
            )}
          </section>
        </>
      )}

      <section aria-label={t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)}>
        <Accordion title={t(AnalyticsEvaluatorsI18nKey.SectionOutputVars)}>
          <div className="flex flex-col gap-2">
            <OutputsEditor
              outputs={draft.outputs}
              type={draft.type}
              isDisabled={isDisabled}
              hasEmptyState
              onChange={(outputs) => onChange({ outputs })}
            />
            {!form.isValid && !(draft.outputs ?? []).length && (
              <span className="text-error dial-tiny-text">{t(AnalyticsEvaluatorsI18nKey.OutputVarsRequired)}</span>
            )}
          </div>
        </Accordion>
      </section>
    </div>
  );
};

export default EvaluatorProperties;
