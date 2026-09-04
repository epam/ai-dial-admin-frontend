'use client';

import { FC } from 'react';

import {
  DialInput,
  DialRadioGroup,
  DialSelectField,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import DurationField from '@/src/components/Analytics/Pipelines/Common/DurationField';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import InputBindingsEditor from '@/src/components/Analytics/Pipelines/Enrich/InputBindingsEditor';
import MemberSelectEditor from '@/src/components/Analytics/Pipelines/Enrich/MemberSelectEditor';
import OutputBindingsEditor from '@/src/components/Analytics/Pipelines/Enrich/OutputBindingsEditor';
import { EnrichFormState } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { LATEST_VERSION, NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { PipelinePriority, ReadyWhen, TriggerKind } from '@/src/models/analytics/pipeline';
import { getControlClassName } from '@/src/utils/entities/view';

// The service validates none of these beyond type, so the console imposes nothing either.
const NUMERIC_KNOBS = [
  { key: 'batch_scan_limit', labelKey: AnalyticsPipelinesI18nKey.BatchScanLimit },
  { key: 'batch_chunk', labelKey: AnalyticsPipelinesI18nKey.BatchChunk },
  { key: 'rate_rpm', labelKey: AnalyticsPipelinesI18nKey.RateRpm },
] as const;

interface Props {
  form: EnrichFormState;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  isModal?: boolean;
}

const EnrichSection: FC<Props> = ({ form, evaluators, hasEvaluatorsError, isModal }) => {
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

  const priorityOptions = [
    { value: PipelinePriority.Live, label: t(AnalyticsPipelinesI18nKey.PriorityLive) },
    { value: PipelinePriority.Backfill, label: t(AnalyticsPipelinesI18nKey.PriorityBackfill) },
  ];

  const onChangeReadyWhen = (patch: Partial<ReadyWhen>) =>
    onTriggerChange({ ready_when: { ...trigger?.ready_when, ...patch } });

  return (
    <div className="flex flex-col gap-y-6">
      <DialSelectField
        id="pipeline-evaluator"
        containerClassName={controlClassName}
        required
        label={t(AnalyticsPipelinesI18nKey.Evaluator)}
        options={evaluatorOptions}
        value={draft.evaluator_name ?? ''}
        error={form.hasEvaluatorError ? t(AnalyticsPipelinesI18nKey.EvaluatorLoadFailed) : undefined}
        invalid={form.hasEvaluatorError}
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
          <DurationField
            id="pipeline-ready-idle"
            label={t(AnalyticsPipelinesI18nKey.ReadyWhenIdle)}
            value={trigger.ready_when?.idle}
            onChange={(idle) => onChangeReadyWhen({ idle })}
          />
          <DurationField
            id="pipeline-ready-max-staleness"
            label={t(AnalyticsPipelinesI18nKey.ReadyWhenMaxStaleness)}
            value={trigger.ready_when?.max_staleness}
            onChange={(max_staleness) => onChangeReadyWhen({ max_staleness })}
          />
          {!isModal && (
            <SqlPredicateField
              id="pipeline-ready-signal"
              label={t(AnalyticsPipelinesI18nKey.ReadyWhenSignal)}
              description={t(AnalyticsPipelinesI18nKey.ReadyWhenSignalCaption)}
              value={trigger.ready_when?.signal}
              sourceName={form.sourceName}
              onChange={(signal) => onChangeReadyWhen({ signal })}
            />
          )}
          {!form.hasReadyWhen && (
            <span className="text-error dial-tiny-text">{t(AnalyticsPipelinesI18nKey.ReadyWhenRequired)}</span>
          )}
          <DialInput
            id="pipeline-cost-ceiling"
            containerClassName={controlClassName}
            wrapperClassName={NUMBER_INPUT_WIDTH}
            type="number"
            min={1}
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.ReadyWhenCostCeiling) }}
            value={trigger.ready_when?.cost_ceiling == null ? '' : String(trigger.ready_when.cost_ceiling)}
            error={form.isCostCeilingValid ? undefined : t(AnalyticsPipelinesI18nKey.CostCeilingInvalid)}
            invalid={!form.isCostCeilingValid}
            onChange={(v) => onChangeReadyWhen({ cost_ceiling: v ? Number(v) : undefined })}
          />

          {!isModal && (
            <div className="flex flex-col gap-2">
              <span className="text-primary dial-small">{t(AnalyticsPipelinesI18nKey.SectionMemberSelect)}</span>
              <MemberSelectEditor
                memberSelect={trigger.member_select}
                columns={form.sourceColumns}
                sourceName={form.sourceName}
                isLimitValid={form.isMemberSelectValid}
                onChange={(member_select) => onTriggerChange({ member_select })}
              />
            </div>
          )}
        </div>
      )}
      <PipelineSharedFields form={form} isModal={isModal} />
      {!isModal && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionInputBindings)}>
          <InputBindingsEditor
            bindings={draft.input_bindings}
            columns={form.sourceColumns}
            vars={form.inputVars}
            isReady={form.isBindingsReady}
            onChange={(input_bindings) => onChange({ input_bindings })}
          />
        </PipelineSection>
      )}
      rather than a deliberate mode, and the moment to say so is registration. Stated on its own so it it is actually
      required: the service refuses a `sql` evaluator with no binding, while it accepts an `llm` one without any — so
      showing it before an evaluator resolves would be an optional field, and
      {(!isModal || form.isBindingsReady) && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionBindings)} isModal={isModal} isExpanded>
          {isModal && <span className="text-primary dial-small">{t(AnalyticsPipelinesI18nKey.OutputBindings)}</span>}
          <OutputBindingsEditor
            bindings={draft.output_bindings}
            columns={form.targetColumns}
            vars={form.outputVars}
            isReady={form.isBindingsReady}
            onChange={(output_bindings) => onChange({ output_bindings })}
          />
          {form.isSqlWithoutBindings && (
            <span className="text-error dial-tiny-text">{t(AnalyticsPipelinesI18nKey.OutputBindingsRequired)}</span>
          )}
          {form.isLlmWithoutBindings && (
            <span className="text-warning dial-tiny-text">{t(AnalyticsPipelinesI18nKey.OutputBindingsDiscarded)}</span>
          )}
        </PipelineSection>
      )}
      {!isModal && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionExecution)}>
          <DialInput
            id="pipeline-sampling"
            containerClassName={controlClassName}
            wrapperClassName={NUMBER_INPUT_WIDTH}
            type="number"
            min={0}
            max={1}
            step={0.05}
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.Sampling) }}
            value={draft.sampling == null ? '' : String(draft.sampling)}
            caption={t(AnalyticsPipelinesI18nKey.SamplingCaption)}
            error={form.isSamplingValid ? undefined : t(AnalyticsPipelinesI18nKey.SamplingInvalid)}
            invalid={!form.isSamplingValid}
            onChange={(v) => onChange({ sampling: v ? Number(v) : undefined })}
          />

          <DialInput
            id="pipeline-cadence"
            containerClassName={controlClassName}
            labelProps={{ label: t(AnalyticsPipelinesI18nKey.Cadence) }}
            value={draft.cadence ?? ''}
            caption={t(AnalyticsPipelinesI18nKey.CadenceCaption)}
            onChange={(v) => onChange({ cadence: v ?? '' })}
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
              value={draft[key] == null ? '' : String(draft[key])}
              onChange={(v) => onChange({ [key]: v ? Number(v) : undefined })}
            />
          ))}

          <DialSelectField
            id="pipeline-priority"
            containerClassName={controlClassName}
            label={t(AnalyticsPipelinesI18nKey.Priority)}
            options={priorityOptions}
            value={draft.priority ?? ''}
            onChange={(v) => onChange({ priority: (v as PipelinePriority) || undefined })}
          />
        </PipelineSection>
      )}
    </div>
  );
};

export default EnrichSection;
