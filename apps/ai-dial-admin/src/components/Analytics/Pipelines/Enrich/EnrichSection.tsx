'use client';

import { FC } from 'react';

import { DialInput, DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import MemberSelectEditor from '@/src/components/Analytics/Pipelines/Enrich/MemberSelectEditor';
import ReadyWhenEditor from '@/src/components/Analytics/Pipelines/Enrich/ReadyWhenEditor';
import TransformSection from '@/src/components/Analytics/Pipelines/Enrich/TransformSection';
import { EnrichFormState } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineAdvanced, TriggerKind } from '@/src/models/analytics/pipeline';
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
}

const EnrichSection: FC<Props> = ({ form }) => {
  const t = useI18n();

  const { draft, onChange, onTriggerChange } = form;
  const trigger = draft.trigger;
  const notSet = t(AnalyticsPipelinesI18nKey.NotSet);

  const controlClassName = getControlClassName();

  const triggerRadios: RadioButtonWithContent[] = [
    { id: TriggerKind.OnIngest, name: t(AnalyticsPipelinesI18nKey.TriggerOnIngest) },
    { id: TriggerKind.Schedule, name: t(AnalyticsPipelinesI18nKey.TriggerSchedule) },
    { id: TriggerKind.Group, name: t(AnalyticsPipelinesI18nKey.TriggerGroup) },
  ];

  const onAdvancedChange = (patch: Partial<PipelineAdvanced>) =>
    onChange({ advanced: { ...draft.advanced, ...patch } });

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
          <div className={controlClassName}>
            <LabelledText label={t(AnalyticsPipelinesI18nKey.GroupBy)} text={form.grainKey || notSet} />
            <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.GroupByCaption)}</span>
          </div>

          <ReadyWhenEditor
            readyWhen={trigger.ready_when}
            sourceName={form.sourceName}
            isCostCeilingValid={form.isCostCeilingValid}
            hasCondition={form.hasReadyWhen}
            onChange={(ready_when) => onTriggerChange({ ready_when })}
          />

          <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionMemberSelect)}>
            <MemberSelectEditor
              memberSelect={trigger.member_select}
              fields={form.sourceFields}
              sourceName={form.sourceName}
              readSource={form.readSource}
              isLimitValid={form.isMemberSelectValid}
              onChange={(member_select) => onTriggerChange({ member_select })}
            />
          </PipelineSection>
        </div>
      )}
    </>
  );

  const transformBlock = (
    <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionTransform)}>
      <TransformSection form={form} isDisabled={!form.isTransformReady} />
    </PipelineSection>
  );

  return (
    <div className="flex flex-col gap-y-6">
      {/* The scope comes first because the trigger's own controls read from it: a group trigger's member
          selection ranks by the source's columns, which are not known until the source is. */}
      <PipelineSharedFields form={form} />
      {triggerBlock}
      {transformBlock}
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
    </div>
  );
};

export default EnrichSection;
