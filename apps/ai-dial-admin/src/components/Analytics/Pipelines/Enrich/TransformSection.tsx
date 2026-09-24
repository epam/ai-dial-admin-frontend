'use client';

import { FC, useMemo } from 'react';

import { DialInput, DialLabel, DialSelectField, DialTextarea, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import OutputsEditor from '@/src/components/Analytics/Pipelines/Enrich/OutputsEditor';
import TransformParamsEditor from '@/src/components/Analytics/Pipelines/Enrich/TransformParamsEditor';
import VariablesEditor from '@/src/components/Analytics/Pipelines/Enrich/VariablesEditor';
import { EnrichFormState } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { withStrandedOption } from '@/src/components/Analytics/Pipelines/Common/utils';
import PlaceholderTokens from '@/src/components/Analytics/Common/PlaceholderTokens';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import { MEMBERS_PLACEHOLDER, MEMBER_BUILT_IN_PLACEHOLDERS } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
import { PlaceholderState, PlaceholderToken } from '@/src/models/analytics/pipeline-ui';
import { extractPlaceholders } from '@/src/utils/analytics/template-placeholders';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  form: EnrichFormState;
  isDisabled?: boolean;
}

// The service accepts the template whether or not it parses, so a stored value that does not is edited
// as text rather than refused — refusing it would leave a live declaration uneditable here.
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

const PLACEHOLDER_DESCRIPTION: Record<string, AnalyticsPipelinesI18nKey> = {
  members: AnalyticsPipelinesI18nKey.PlaceholderMembers,
  members_included: AnalyticsPipelinesI18nKey.PlaceholderMembersIncluded,
  members_omitted: AnalyticsPipelinesI18nKey.PlaceholderMembersOmitted,
  members_truncated: AnalyticsPipelinesI18nKey.PlaceholderMembersTruncated,
  members_notice: AnalyticsPipelinesI18nKey.PlaceholderMembersNotice,
};

/**
 * What this presents follows `transform.type`: a `sql` transform is refused for declaring a model, params,
 * a template or inputs, so none of them is offered for it.
 */
const TransformSection: FC<Props> = ({ form, isDisabled }) => {
  const t = useI18n();

  const { transform, onTransformChange, isTransformReady, targetColumns } = form;
  const controlClassName = getControlClassName();

  // Keyed on sql rather than on llm, so a type the service adds later still shows what is declared.
  const isSql = transform?.type === TransformType.Sql;

  const typeOptions = [
    { value: TransformType.Llm, label: t(AnalyticsPipelinesI18nKey.TransformTypeLlm) },
    { value: TransformType.Sql, label: t(AnalyticsPipelinesI18nKey.TransformTypeSql) },
  ];

  const templateObject = useMemo(() => asJsonObject(transform?.request_template), [transform?.request_template]);

  const referenced = useMemo(() => extractPlaceholders(transform?.request_template), [transform?.request_template]);

  // The one template rule this form can settle: at group grain the service refuses a declaration whose
  // template names no `{{members}}`, and the trigger is on the same draft.
  const isGroupGrain = form.draft.trigger?.kind === TriggerKind.Group;
  const isMembersMissing = isGroupGrain && !referenced.includes(MEMBERS_PLACEHOLDER);

  // At group grain the render supplies the service's own built-ins and an input becomes a field of each
  // member object, so the correspondence does not hold there.
  const placeholderTokens = useMemo<PlaceholderToken[]>(() => {
    if (isGroupGrain) return [];

    const inputNames = Object.keys(transform?.inputs ?? {});

    return [
      ...referenced.map((name) => ({
        name,
        state: inputNames.includes(name) ? PlaceholderState.Covered : PlaceholderState.Uncovered,
      })),
      ...inputNames
        .filter((name) => !referenced.includes(name))
        .map((name) => ({ name, state: PlaceholderState.Unused })),
    ];
  }, [isGroupGrain, referenced, transform?.inputs]);

  const memberTokens: PlaceholderToken[] = MEMBER_BUILT_IN_PLACEHOLDERS.map((name) => ({
    name,
    state: referenced.includes(name) ? PlaceholderState.Covered : PlaceholderState.Available,
    description: t(PLACEHOLDER_DESCRIPTION[name] ?? AnalyticsPipelinesI18nKey.PlaceholderMembers),
  }));

  return (
    <div className="flex flex-col gap-y-6">
      <DialSelectField
        id="transform-type"
        label={t(AnalyticsPipelinesI18nKey.TransformType)}
        required
        options={withStrandedOption(typeOptions, transform?.type)}
        value={transform?.type ?? ''}
        disabled={isDisabled}
        containerClassName={controlClassName}
        onChange={(value) => onTransformChange({ type: value as TransformType })}
      />

      {!isSql && (
        <>
          <DialInput
            id="transform-model"
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.Model) }}
            value={transform?.model ?? ''}
            disabled={isDisabled}
            containerClassName={controlClassName}
            onChange={(v) => onTransformChange({ model: v ?? '' })}
          />

          <section aria-label={t(AnalyticsPipelinesI18nKey.SectionParams)} className="flex flex-col gap-2">
            <h2 className="text-primary dial-small">{t(AnalyticsPipelinesI18nKey.SectionParams)}</h2>
            <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.ParamsHint)}</span>
            <TransformParamsEditor
              params={transform?.params ?? {}}
              isDisabled={isDisabled}
              onChange={(params) => onTransformChange({ params })}
            />
          </section>

          <section aria-label={t(AnalyticsPipelinesI18nKey.SectionRequestTemplate)} className="flex flex-col gap-2">
            <DialLabel
              htmlFor="transform-request-template"
              label={
                <span className="flex flex-row items-center gap-1">
                  {t(AnalyticsPipelinesI18nKey.SectionRequestTemplate)}
                  <DialTooltip tooltip={t(AnalyticsPipelinesI18nKey.TemplatePlaceholders)}>
                    {/* Sized to the label rather than to a button: it sits in the text, not beside it. */}
                    <IconInfoCircle size={LABEL_ICON_SIZE} stroke={2} className="text-secondary" />
                  </DialTooltip>
                </span>
              }
            />

            <PlaceholderTokens tokens={memberTokens} label={t(AnalyticsPipelinesI18nKey.TemplatePlaceholders)} />

            {templateObject ? (
              <JsonEditorInput
                elementId="transform-request-template"
                value={templateObject}
                disabled={isDisabled}
                inputClassName={controlClassName}
                onChangeValue={(value) => onTransformChange({ request_template: JSON.stringify(value) })}
              />
            ) : (
              <DialTextarea
                id="transform-request-template"
                value={transform?.request_template ?? ''}
                disabled={isDisabled}
                caption={t(AnalyticsPipelinesI18nKey.TemplateNotJson)}
                className="font-mono"
                rows={8}
                spellCheck={false}
                onChange={(value) => onTransformChange({ request_template: value })}
              />
            )}

            {/* An error rather than a hint: the save would be refused, not merely degraded. */}
            {isMembersMissing && (
              <span role="alert" className="text-error dial-tiny-text">
                {t(AnalyticsPipelinesI18nKey.MembersPlaceholderMissing)}
              </span>
            )}

            {!isGroupGrain && (
              <span className="text-secondary dial-tiny-text">
                {t(AnalyticsPipelinesI18nKey.TemplatePlaceholdersCaption)}
              </span>
            )}
          </section>
        </>
      )}

      {/* `transform.inputs` on the wire, between the template its names are matched against and the
          outputs — one block in the order the service reads it. A sql transform renders no request, and
          the service refuses one declaring inputs, so the section is absent rather than empty. */}
      {!isSql && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionInputs)}>
          <div className="flex flex-col gap-3">
            <VariablesEditor
              vars={transform?.inputs}
              fields={form.sourceFields}
              isReady={form.isVariablesReady}
              hasError={form.hasSourceEntityError}
              onChange={(inputs) => onTransformChange({ inputs })}
            />
            {placeholderTokens.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.PlaceholdersTitle)}</span>
                <PlaceholderTokens tokens={placeholderTokens} label={t(AnalyticsPipelinesI18nKey.PlaceholdersTitle)} />
              </div>
            )}
          </div>
        </PipelineSection>
      )}

      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionOutputs)}>
        <OutputsEditor
          outputs={transform?.outputs}
          type={transform?.type ?? TransformType.Llm}
          columns={targetColumns}
          isReady={isTransformReady}
          isDisabled={isDisabled}
          hasEmptyState
          hasRefinement
          onChange={(outputs) => onTransformChange({ outputs })}
        />
      </PipelineSection>
    </div>
  );
};

export default TransformSection;
