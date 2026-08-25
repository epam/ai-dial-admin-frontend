'use client';

import { FC } from 'react';

import {
  DialInput,
  DialRadioGroup,
  DialSelectField,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import CronField from '@/src/components/Analytics/EnrichmentRules/CronField';
import DurationField from '@/src/components/Analytics/EnrichmentRules/DurationField';
import InputBindingsEditor from '@/src/components/Analytics/EnrichmentRules/InputBindingsEditor';
import MemberSelectEditor from '@/src/components/Analytics/EnrichmentRules/MemberSelectEditor';
import OutputBindingsEditor from '@/src/components/Analytics/EnrichmentRules/OutputBindingsEditor';
import SourceField from '@/src/components/Analytics/EnrichmentRules/SourceField';
import SqlPredicateField from '@/src/components/Analytics/EnrichmentRules/SqlPredicateField';
import RuleSection from '@/src/components/Analytics/EnrichmentRules/Properties/RuleSection';
import { RuleFormState } from '@/src/components/Analytics/EnrichmentRules/use-rule-form';
import { LATEST_VERSION, NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/enrichment-rules';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { RulePriority, TriggerKind } from '@/src/models/analytics/rule';
import { getControlClassName } from '@/src/utils/entities/view';

// The service validates none of these beyond type, so the console imposes nothing either.
const NUMERIC_KNOBS = [
  { key: 'batch_scan_limit', labelKey: AnalyticsEnrichmentRulesI18nKey.BatchScanLimit },
  { key: 'batch_chunk', labelKey: AnalyticsEnrichmentRulesI18nKey.BatchChunk },
  { key: 'rate_rpm', labelKey: AnalyticsEnrichmentRulesI18nKey.RateRpm },
] as const;

interface Props {
  form: RuleFormState;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  isModal?: boolean;
}

const RuleProperties: FC<Props> = ({ form, evaluators, hasEvaluatorsError, isModal }) => {
  const t = useI18n();

  const { draft, onChange } = form;

  // A control alone on its line is width-capped on the detail page and full-width in the modal, matching
  // the convention in QueryProperties.
  const controlClassName = getControlClassName(isModal);

  const selectedEvaluator = evaluators.find((item) => item.name === draft.evaluator_name);
  const evaluatorOptions = evaluators.map((item) => ({ value: item.name, label: item.name }));

  const latestVersion = selectedEvaluator?.latest_version ?? 0;
  const versionOptions = [
    { value: LATEST_VERSION, label: t(AnalyticsEnrichmentRulesI18nKey.VersionLatest) },
    ...Array.from({ length: latestVersion }, (_, index) => {
      const version = String(latestVersion - index);
      return { value: version, label: version };
    }),
  ];

  const targetOptions = form.availableTargets.map((table) => ({ value: table.name, label: table.name }));

  const triggerRadios: RadioButtonWithContent[] = [
    { id: TriggerKind.OnIngest, name: t(AnalyticsEnrichmentRulesI18nKey.TriggerOnIngest) },
    { id: TriggerKind.Schedule, name: t(AnalyticsEnrichmentRulesI18nKey.TriggerSchedule) },
    { id: TriggerKind.Group, name: t(AnalyticsEnrichmentRulesI18nKey.TriggerGroup) },
  ];

  const enabledRadios: RadioButtonWithContent[] = [
    {
      id: 'true',
      name: t(AnalyticsEnrichmentRulesI18nKey.EnabledYes),
      content: (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.EnabledYesCaption)}</span>
      ),
    },
    {
      id: 'false',
      name: t(AnalyticsEnrichmentRulesI18nKey.EnabledNo),
      content: (
        <span className="text-secondary dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.EnabledNoCaption)}</span>
      ),
    },
  ];

  const priorityOptions = [
    { value: RulePriority.Live, label: t(AnalyticsEnrichmentRulesI18nKey.PriorityLive) },
    { value: RulePriority.Backfill, label: t(AnalyticsEnrichmentRulesI18nKey.PriorityBackfill) },
  ];

  const onChangeReadyWhen = (patch: Partial<NonNullable<typeof draft.ready_when>>) =>
    onChange({ ready_when: { ...draft.ready_when, ...patch } });

  return (
    <div className="flex flex-col gap-y-6">
      <DialInput
        id="rule-name"
        containerClassName={controlClassName}
        labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.Name), required: true }}
        value={draft.name ?? ''}
        onChange={(v) => onChange({ name: v ?? '' })}
      />

      <DialSelectField
        id="rule-evaluator"
        containerClassName={controlClassName}
        required
        label={t(AnalyticsEnrichmentRulesI18nKey.Evaluator)}
        options={evaluatorOptions}
        value={draft.evaluator_name ?? ''}
        error={form.hasEvaluatorError ? t(AnalyticsEnrichmentRulesI18nKey.EvaluatorLoadFailed) : undefined}
        invalid={form.hasEvaluatorError}
        onChange={(v) => onChange({ evaluator_name: v as string })}
      />

      {hasEvaluatorsError && (
        <span className="text-error dial-small">{t(AnalyticsEnrichmentRulesI18nKey.EvaluatorsLoadFailed)}</span>
      )}
      {!hasEvaluatorsError && evaluators.length === 0 && (
        <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.NoEvaluatorsNote)}</span>
      )}

      <DialSelectField
        id="rule-evaluator-version"
        containerClassName={controlClassName}
        label={t(AnalyticsEnrichmentRulesI18nKey.EvaluatorVersion)}
        options={versionOptions}
        value={draft.evaluator_version == null ? LATEST_VERSION : String(draft.evaluator_version)}
        disabled={!draft.evaluator_name}
        onChange={(v) => onChange({ evaluator_version: v === LATEST_VERSION ? undefined : Number(v) })}
      />

      <DialSelectField
        id="rule-target"
        containerClassName={controlClassName}
        required
        label={t(AnalyticsEnrichmentRulesI18nKey.TargetEnrichment)}
        options={targetOptions}
        value={draft.target_enrichment ?? ''}
        error={form.hasTargetError ? t(AnalyticsEnrichmentRulesI18nKey.TargetLoadFailed) : undefined}
        invalid={form.hasTargetError}
        onChange={(v) => onChange({ target_enrichment: v as string })}
      />

      {!form.isTablesLoading && targetOptions.length === 0 && (
        <span className="text-secondary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.NoAvailableTargets)}</span>
      )}

      <DialRadioGroup
        elementId="rule-trigger-kind"
        fieldTitle={t(AnalyticsEnrichmentRulesI18nKey.TriggerKind)}
        orientation={RadioGroupOrientation.Row}
        radioButtons={triggerRadios}
        activeRadioButton={draft.trigger_kind ?? ''}
        onChange={(id) => onChange({ trigger_kind: id as TriggerKind })}
      />

      {draft.trigger_kind === TriggerKind.Schedule && (
        <CronField value={draft.trigger_cron ?? ''} onChange={(v) => onChange({ trigger_cron: v })} />
      )}

      {draft.trigger_kind === TriggerKind.Group && (
        <div className="flex flex-col gap-y-6">
          <DialInput
            id="rule-group-by"
            containerClassName={controlClassName}
            labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.GroupBy) }}
            value={form.grainKey}
            caption={t(AnalyticsEnrichmentRulesI18nKey.GroupByCaption)}
            readOnly
          />
          <DurationField
            id="rule-ready-idle"
            label={t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenIdle)}
            value={draft.ready_when?.idle}
            onChange={(v) => onChangeReadyWhen({ idle: v })}
          />
          <DurationField
            id="rule-ready-max-staleness"
            label={t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenMaxStaleness)}
            value={draft.ready_when?.max_staleness}
            onChange={(v) => onChangeReadyWhen({ max_staleness: v })}
          />
          {!isModal && (
            <SqlPredicateField
              id="rule-ready-signal"
              label={t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenSignal)}
              description={t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenSignalCaption)}
              value={draft.ready_when?.signal}
              sourceName={form.sourceName}
              onChange={(signal) => onChangeReadyWhen({ signal })}
            />
          )}
          {!form.hasReadyWhen && (
            <span className="text-error dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenRequired)}</span>
          )}
          <DialInput
            id="rule-cost-ceiling"
            containerClassName={controlClassName}
            wrapperClassName={NUMBER_INPUT_WIDTH}
            type="number"
            min={1}
            labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.ReadyWhenCostCeiling) }}
            value={draft.ready_when?.cost_ceiling == null ? '' : String(draft.ready_when.cost_ceiling)}
            error={form.isCostCeilingValid ? undefined : t(AnalyticsEnrichmentRulesI18nKey.CostCeilingInvalid)}
            invalid={!form.isCostCeilingValid}
            onChange={(v) => onChangeReadyWhen({ cost_ceiling: v ? Number(v) : undefined })}
          />

          {!isModal && (
            <div className="flex flex-col gap-2">
              <span className="text-primary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.SectionMemberSelect)}</span>
              <MemberSelectEditor
                memberSelect={draft.member_select}
                columns={form.sourceColumns}
                sourceName={form.sourceName}
                isLimitValid={form.isMemberSelectValid}
                onChange={(member_select) => onChange({ member_select })}
              />
            </div>
          )}
        </div>
      )}

      {!isModal && (
        <RuleSection title={t(AnalyticsEnrichmentRulesI18nKey.SectionReadScope)}>
          <SourceField
            className={controlClassName}
            source={draft.source}
            sourceTable={form.target?.source_table}
            tables={form.tables}
            onChange={(source) => onChange({ source })}
          />

          <SqlPredicateField
            className={controlClassName}
            id="rule-filter-sql"
            label={t(AnalyticsEnrichmentRulesI18nKey.FilterSql)}
            description={t(AnalyticsEnrichmentRulesI18nKey.FilterSqlDescription)}
            value={draft.filter_sql}
            sourceName={form.sourceName}
            onChange={(filter_sql) => onChange({ filter_sql })}
          />

          <DialInput
            id="rule-sampling"
            containerClassName={controlClassName}
            wrapperClassName={NUMBER_INPUT_WIDTH}
            type="number"
            min={0}
            max={1}
            step={0.05}
            labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.Sampling) }}
            value={draft.sampling == null ? '' : String(draft.sampling)}
            caption={t(AnalyticsEnrichmentRulesI18nKey.SamplingCaption)}
            error={form.isSamplingValid ? undefined : t(AnalyticsEnrichmentRulesI18nKey.SamplingInvalid)}
            invalid={!form.isSamplingValid}
            onChange={(v) => onChange({ sampling: v ? Number(v) : undefined })}
          />
        </RuleSection>
      )}

      {!isModal && (
        <RuleSection title={t(AnalyticsEnrichmentRulesI18nKey.SectionInputBindings)}>
          <InputBindingsEditor
            bindings={draft.input_bindings}
            columns={form.sourceColumns}
            vars={form.inputVars}
            isReady={form.isBindingsReady}
            onChange={(input_bindings) => onChange({ input_bindings })}
          />
        </RuleSection>
      )}

      <RuleSection title={t(AnalyticsEnrichmentRulesI18nKey.SectionBindings)} isModal={isModal} isExpanded>
        {isModal && (
          <span className="text-primary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.OutputBindings)}</span>
        )}
        <OutputBindingsEditor
          bindings={draft.output_bindings}
          columns={form.targetColumns}
          vars={form.outputVars}
          isReady={form.isBindingsReady}
          onChange={(output_bindings) => onChange({ output_bindings })}
        />
        {form.isSqlWithoutBindings && (
          <span className="text-error dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.OutputBindingsRequired)}</span>
        )}
        {form.isLlmWithoutBindings && (
          <span className="text-warning dial-tiny-text">
            {t(AnalyticsEnrichmentRulesI18nKey.OutputBindingsDiscarded)}
          </span>
        )}
      </RuleSection>

      {!isModal && (
        <RuleSection title={t(AnalyticsEnrichmentRulesI18nKey.SectionExecution)}>
          <DialInput
            id="rule-cadence"
            containerClassName={controlClassName}
            labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.Cadence) }}
            value={draft.cadence ?? ''}
            caption={t(AnalyticsEnrichmentRulesI18nKey.CadenceCaption)}
            onChange={(v) => onChange({ cadence: v ?? '' })}
          />

          {NUMERIC_KNOBS.map(({ key, labelKey }) => (
            <DialInput
              key={key}
              id={`rule-${key}`}
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
            id="rule-priority"
            containerClassName={controlClassName}
            label={t(AnalyticsEnrichmentRulesI18nKey.Priority)}
            options={priorityOptions}
            value={draft.priority ?? ''}
            onChange={(v) => onChange({ priority: (v as RulePriority) || undefined })}
          />
        </RuleSection>
      )}

      {isModal && (
        <DialRadioGroup
          elementId="rule-enabled"
          fieldTitle={t(AnalyticsEnrichmentRulesI18nKey.Enabled)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={enabledRadios}
          activeRadioButton={draft.enabled == null ? '' : String(draft.enabled)}
          onChange={(id) => onChange({ enabled: id === 'true' })}
        />
      )}
    </div>
  );
};

export default RuleProperties;
