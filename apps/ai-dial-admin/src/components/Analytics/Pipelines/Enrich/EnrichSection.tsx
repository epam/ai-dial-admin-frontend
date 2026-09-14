'use client';

import { FC, ReactNode, useMemo } from 'react';

import {
  DialInput,
  DialRadioGroup,
  DialSelectField,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import PlaceholderTokens from '@/src/components/Analytics/Common/PlaceholderTokens';
import MemberSelectEditor from '@/src/components/Analytics/Pipelines/Enrich/MemberSelectEditor';
import ReadyWhenEditor from '@/src/components/Analytics/Pipelines/Enrich/ReadyWhenEditor';
import VariablesEditor from '@/src/components/Analytics/Pipelines/Enrich/VariablesEditor';
import { EnrichFormState } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { LATEST_VERSION, MEMBERS_PLACEHOLDER, NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary, EvaluatorType } from '@/src/models/analytics/evaluator';
import { PipelineAdvanced, TriggerKind } from '@/src/models/analytics/pipeline';
import { PlaceholderState, PlaceholderToken } from '@/src/models/analytics/pipeline-ui';
import { extractPlaceholders } from '@/src/utils/analytics/template-placeholders';
import { getControlClassName } from '@/src/utils/entities/view';

// The service validates none of these beyond type, so the console imposes nothing either — except the
// sample fraction, which it refuses at zero.
const NUMERIC_KNOBS = [
  { key: 'rows_per_scan', labelKey: AnalyticsPipelinesI18nKey.RowsPerScan },
  { key: 'rows_per_call', labelKey: AnalyticsPipelinesI18nKey.RowsPerCall },
  { key: 'rate_rpm', labelKey: AnalyticsPipelinesI18nKey.RateRpm },
] as const;

interface Props {
  form: EnrichFormState;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  isModal?: boolean;
  /** Read-only, and placed here rather than by the frame so it lands just before the runner knobs. */
  stateSection?: ReactNode;
}

const EnrichSection: FC<Props> = ({ form, evaluators, hasEvaluatorsError, isModal, stateSection }) => {
  const t = useI18n();

  const { draft, onChange, onTriggerChange } = form;
  const trigger = draft.trigger;

  // A control alone on its line is width-capped on the detail page and full-width in the modal, matching
  // the convention in QueryProperties.
  const controlClassName = getControlClassName(isModal);

  const selectedEvaluator = evaluators.find((item) => item.name === draft.evaluator_name);
  const evaluatorOptions = evaluators.map((item) => ({ value: item.name, label: item.name }));

  const latestVersion = selectedEvaluator?.latest_version ?? 0;
  const versionOptions = [
    { value: LATEST_VERSION, label: t(AnalyticsPipelinesI18nKey.VersionLatest) },
    ...Array.from({ length: latestVersion }, (_, index) => {
      const version = String(latestVersion - index);
      return { value: version, label: version };
    }),
  ];

  const triggerRadios: RadioButtonWithContent[] = [
    { id: TriggerKind.OnIngest, name: t(AnalyticsPipelinesI18nKey.TriggerOnIngest) },
    { id: TriggerKind.Schedule, name: t(AnalyticsPipelinesI18nKey.TriggerSchedule) },
    { id: TriggerKind.Group, name: t(AnalyticsPipelinesI18nKey.TriggerGroup) },
  ];

  const onAdvancedChange = (patch: Partial<PipelineAdvanced>) =>
    onChange({ advanced: { ...draft.advanced, ...patch } });

  // At group grain the render supplies the service's own member built-ins and a variable becomes a field
  // of each member object, so the correspondence below does not hold there.
  const isRowGrain = trigger?.kind !== TriggerKind.Group;

  // A sql evaluator asks no model anything, so there is no request to render and nothing to bind: the
  // service refuses a sql pipeline that declares vars at all.
  const isSqlEvaluator = form.evaluator?.type === EvaluatorType.Sql;

  // The one template rule this form can settle: at group grain the service refuses a declaration whose
  // template names no `{{members}}`. Unlike the evaluator form, this one knows the trigger.
  const isMembersMissing =
    !isRowGrain &&
    Boolean(form.evaluator?.request_template) &&
    !extractPlaceholders(form.evaluator?.request_template).includes(MEMBERS_PLACEHOLDER);

  const evaluatorError = (() => {
    if (form.hasEvaluatorError) return t(AnalyticsPipelinesI18nKey.EvaluatorLoadFailed);
    if (isMembersMissing) return t(AnalyticsPipelinesI18nKey.MembersPlaceholderMissing);
    return undefined;
  })();

  const placeholderTokens = useMemo<PlaceholderToken[]>(() => {
    if (!isRowGrain) return [];

    const placeholders = extractPlaceholders(form.evaluator?.request_template);
    const varNames = Object.keys(draft.vars ?? {});

    return [
      ...placeholders.map((name) => ({
        name,
        state: varNames.includes(name) ? PlaceholderState.Covered : PlaceholderState.Uncovered,
      })),
      ...varNames
        .filter((name) => !placeholders.includes(name))
        .map((name) => ({ name, state: PlaceholderState.Unused })),
    ];
  }, [draft.vars, form.evaluator?.request_template, isRowGrain]);

  return (
    <div className="flex flex-col gap-y-6">
      <DialSelectField
        id="pipeline-evaluator"
        containerClassName={controlClassName}
        required
        label={t(AnalyticsPipelinesI18nKey.Evaluator)}
        options={evaluatorOptions}
        value={draft.evaluator_name ?? ''}
        error={evaluatorError}
        invalid={Boolean(evaluatorError)}
        onChange={(v) => onChange({ evaluator_name: v as string })}
      />
      {hasEvaluatorsError && (
        <span className="text-error dial-small">{t(AnalyticsPipelinesI18nKey.EvaluatorsLoadFailed)}</span>
      )}
      {!hasEvaluatorsError && evaluators.length === 0 && (
        <span className="text-secondary dial-small">{t(AnalyticsPipelinesI18nKey.NoEvaluatorsNote)}</span>
      )}
      {!isModal && (
        <DialSelectField
          id="pipeline-evaluator-version"
          containerClassName={controlClassName}
          label={t(AnalyticsPipelinesI18nKey.EvaluatorVersion)}
          options={versionOptions}
          value={draft.evaluator_version == null ? LATEST_VERSION : String(draft.evaluator_version)}
          disabled={!draft.evaluator_name}
          onChange={(v) => onChange({ evaluator_version: v === LATEST_VERSION ? undefined : Number(v) })}
        />
      )}
      <DialRadioGroup
        elementId="pipeline-trigger-kind"
        fieldTitle={t(AnalyticsPipelinesI18nKey.TriggerKind)}
        orientation={RadioGroupOrientation.Row}
        radioButtons={triggerRadios}
        activeRadioButton={trigger?.kind ?? ''}
        onChange={(id) => onTriggerChange({ kind: id as TriggerKind })}
      />
      {trigger?.kind === TriggerKind.Schedule && (
        <CronField value={trigger.cron ?? ''} onChange={(cron) => onTriggerChange({ cron })} />
      )}
      {trigger?.kind === TriggerKind.Group && (
        <div className="flex flex-col gap-y-6">
          <DialInput
            id="pipeline-group-by"
            containerClassName={controlClassName}
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.GroupBy) }}
            value={form.grainKey}
            caption={t(AnalyticsPipelinesI18nKey.GroupByCaption)}
            readOnly
          />

          <ReadyWhenEditor
            readyWhen={trigger.ready_when}
            sourceName={form.sourceName}
            isCostCeilingValid={form.isCostCeilingValid}
            hasCondition={form.hasReadyWhen}
            isModal={isModal}
            onChange={(ready_when) => onTriggerChange({ ready_when })}
          />

          {!isModal && (
            <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionMemberSelect)}>
              <MemberSelectEditor
                memberSelect={trigger.member_select}
                columns={form.sourceColumns}
                sourceName={form.sourceName}
                readSource={form.readSource}
                isLimitValid={form.isMemberSelectValid}
                onChange={(member_select) => onTriggerChange({ member_select })}
              />
            </PipelineSection>
          )}
        </div>
      )}
      <PipelineSharedFields form={form} isModal={isModal} />
      {!isModal && !isSqlEvaluator && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionVariables)}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              <VariablesEditor
                vars={draft.vars}
                outputs={form.outputs}
                columns={form.sourceColumns}
                isReady={form.isVariablesReady}
                onChange={(vars) => onChange({ vars })}
              />
              {/* Nothing to correspond with when the evaluator has no template at all — a sql one never
                  does — so the heading goes with the chips rather than standing over an empty row. */}
              {isRowGrain && placeholderTokens.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-secondary dial-tiny-text">
                    {t(AnalyticsPipelinesI18nKey.PlaceholdersTitle)}
                  </span>
                  <PlaceholderTokens
                    tokens={placeholderTokens}
                    label={t(AnalyticsPipelinesI18nKey.PlaceholdersTitle)}
                  />
                </div>
              )}
            </div>
          </div>
        </PipelineSection>
      )}
      {!isModal && stateSection}
      {!isModal && (
        <Accordion title={t(AnalyticsPipelinesI18nKey.SectionAdvanced)}>
          <div className="flex flex-col gap-y-6">
            <DialInput
              id="pipeline-scan-every"
              containerClassName={controlClassName}
              wrapperClassName={NUMBER_INPUT_WIDTH}
              labelProps={{ label: t(AnalyticsPipelinesI18nKey.ScanEvery) }}
              value={draft.advanced?.scan_every ?? ''}
              caption={t(AnalyticsPipelinesI18nKey.ScanEveryCaption)}
              onChange={(v) => onAdvancedChange({ scan_every: v || undefined })}
            />

            {NUMERIC_KNOBS.map(({ key, labelKey }) => (
              <DialInput
                key={key}
                id={`pipeline-${key}`}
                containerClassName={controlClassName}
                wrapperClassName={NUMBER_INPUT_WIDTH}
                type="number"
                min={0}
                labelProps={{ label: t(labelKey) }}
                value={draft.advanced?.[key] == null ? '' : String(draft.advanced[key])}
                onChange={(v) => onAdvancedChange({ [key]: v ? Number(v) : undefined })}
              />
            ))}

            <DialInput
              id="pipeline-sample-fraction"
              containerClassName={controlClassName}
              wrapperClassName={NUMBER_INPUT_WIDTH}
              type="number"
              min={0}
              max={1}
              step={0.05}
              labelProps={{ label: t(AnalyticsPipelinesI18nKey.SampleFraction) }}
              value={draft.advanced?.sample_fraction == null ? '' : String(draft.advanced.sample_fraction)}
              caption={t(AnalyticsPipelinesI18nKey.SampleFractionCaption)}
              error={form.isSampleFractionValid ? undefined : t(AnalyticsPipelinesI18nKey.SampleFractionInvalid)}
              invalid={!form.isSampleFractionValid}
              onChange={(v) => onAdvancedChange({ sample_fraction: v ? Number(v) : undefined })}
            />
          </div>
        </Accordion>
      )}
    </div>
  );
};

export default EnrichSection;
