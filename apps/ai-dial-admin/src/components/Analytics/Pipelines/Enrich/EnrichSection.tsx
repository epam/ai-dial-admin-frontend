'use client';

import { FC, ReactNode, useMemo } from 'react';

import { DialInput, DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import PlaceholderTokens from '@/src/components/Analytics/Common/PlaceholderTokens';
import MemberSelectEditor from '@/src/components/Analytics/Pipelines/Enrich/MemberSelectEditor';
import ReadyWhenEditor from '@/src/components/Analytics/Pipelines/Enrich/ReadyWhenEditor';
import TransformSection from '@/src/components/Analytics/Pipelines/Enrich/TransformSection';
import VariablesEditor from '@/src/components/Analytics/Pipelines/Enrich/VariablesEditor';
import { EnrichFormState } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineAdvanced, TransformType, TriggerKind } from '@/src/models/analytics/pipeline';
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
  isModal?: boolean;
  /** Read-only, and placed here rather than by the frame so it lands just before the runner knobs. */
  stateSection?: ReactNode;
}

const EnrichSection: FC<Props> = ({ form, isModal, stateSection }) => {
  const t = useI18n();

  const { draft, onChange, onTriggerChange } = form;
  const trigger = draft.trigger;

  // A control alone on its line is width-capped on the detail page and full-width in the modal, matching
  // the convention in QueryProperties.
  const controlClassName = getControlClassName(isModal);

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

  // A sql transform renders no request, so there is nothing for a variable to bind into.
  const isSqlTransform = draft.transform?.type === TransformType.Sql;

  const placeholderTokens = useMemo<PlaceholderToken[]>(() => {
    if (!isRowGrain) return [];

    const placeholders = extractPlaceholders(draft.transform?.request_template);
    const inputNames = Object.keys(draft.transform?.inputs ?? {});

    return [
      ...placeholders.map((name) => ({
        name,
        state: inputNames.includes(name) ? PlaceholderState.Covered : PlaceholderState.Uncovered,
      })),
      ...inputNames
        .filter((name) => !placeholders.includes(name))
        .map((name) => ({ name, state: PlaceholderState.Unused })),
    ];
  }, [draft.transform?.inputs, draft.transform?.request_template, isRowGrain]);

  const triggerBlock = (
    <>
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
    </>
  );

  const scopeAndTransformBlock = (
    <>
      <PipelineSharedFields form={form} isModal={isModal} />
      <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionTransform)}>
        <TransformSection form={form} isModal={isModal} isDisabled={!form.isTransformReady} />
      </PipelineSection>
    </>
  );

  return (
    <div className="flex flex-col gap-y-6">
      {/* The modal asks for the target before the transform, whose outputs are its columns. The detail
          page keeps the trigger above the sections, belonging as it does to neither kind. */}
      {isModal ? (
        <>
          {scopeAndTransformBlock}
          {triggerBlock}
        </>
      ) : (
        <>
          {triggerBlock}
          {scopeAndTransformBlock}
        </>
      )}
      {!isModal && !isSqlTransform && (
        <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionVariables)}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              <VariablesEditor
                vars={draft.transform?.inputs}
                columns={form.sourceColumns}
                isReady={form.isVariablesReady}
                onChange={(inputs) => form.onTransformChange({ inputs })}
              />
              {/* Nothing to correspond with when the transform has no template at all — a sql one never
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
