'use client';

import { FC, useEffect, useState } from 'react';

import { DialCheckbox, DialInput } from '@epam/ai-dial-ui-kit';

import DurationPresetField from '@/src/components/Analytics/Pipelines/Common/DurationPresetField';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import Accordion from '@/src/components/Common/Accordion/Accordion';
import { IDLE_PRESETS, MAX_STALENESS_PRESETS, NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ReadyWhen } from '@/src/models/analytics/pipeline';
import { ReadyWhenCondition } from '@/src/models/analytics/pipeline-ui';

interface Props {
  readyWhen?: ReadyWhen;
  sourceName?: string;
  isCostCeilingValid: boolean;
  hasCondition: boolean;
  isModal?: boolean;
  onChange: (readyWhen: ReadyWhen) => void;
}

// The control sits under its checkbox, indented past the box, so what it belongs to is read from the
// layout rather than from a label repeating the checkbox's own words.
const CONDITION_CONTROL_INDENT = 'pl-7';

const declared = (kept: ReadyWhen, enabled: Set<ReadyWhenCondition>): ReadyWhen => ({
  ...(enabled.has(ReadyWhenCondition.Idle) && kept.idle ? { idle: kept.idle } : {}),
  ...(enabled.has(ReadyWhenCondition.Signal) && kept.signal ? { signal: kept.signal } : {}),
  ...(enabled.has(ReadyWhenCondition.MaxStaleness) && kept.max_staleness ? { max_staleness: kept.max_staleness } : {}),
  ...(kept.cost_ceiling ? { cost_ceiling: kept.cost_ceiling } : {}),
});

const isSameDeclaration = (kept: ReadyWhen, readyWhen: ReadyWhen | undefined, enabled: Set<ReadyWhenCondition>) =>
  JSON.stringify(declared(kept, enabled)) === JSON.stringify(readyWhen ?? {});

const enabledFrom = (readyWhen?: ReadyWhen): Set<ReadyWhenCondition> => {
  const enabled = new Set<ReadyWhenCondition>();
  if (readyWhen?.idle) enabled.add(ReadyWhenCondition.Idle);
  if (readyWhen?.signal) enabled.add(ReadyWhenCondition.Signal);
  if (readyWhen?.max_staleness) enabled.add(ReadyWhenCondition.MaxStaleness);
  return enabled;
};

/**
 * The service requires at least one of the three, because a declaration satisfying none leaves a group
 * permanently dirty and never ready. Unchecking a condition keeps what was typed on screen and drops the
 * member from the request, so toggling one off and on again does not retype it.
 *
 * A disabled condition keeps its control on screen rather than hiding it, so enabling one does not move
 * everything below it.
 */
const ReadyWhenEditor: FC<Props> = ({ readyWhen, sourceName, isCostCeilingValid, hasCondition, isModal, onChange }) => {
  const t = useI18n();

  const [enabled, setEnabled] = useState<Set<ReadyWhenCondition>>(() => enabledFrom(readyWhen));
  const [kept, setKept] = useState<ReadyWhen>(() => readyWhen ?? {});

  // A discard restores the stored declaration without remounting this editor, so the kept values and the
  // enabled set are re-seeded whenever the prop says something they do not.
  useEffect(() => {
    setKept((current) => (isSameDeclaration(current, readyWhen, enabled) ? current : (readyWhen ?? {})));
    setEnabled((current) => (isSameDeclaration(kept, readyWhen, current) ? current : enabledFrom(readyWhen)));
    // `kept` is read to compare, not to react to: including it would re-seed on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyWhen]);

  const emit = (next: ReadyWhen, nextEnabled: Set<ReadyWhenCondition>) => {
    setKept(next);
    onChange(declared(next, nextEnabled));
  };

  const onToggle = (condition: ReadyWhenCondition, isChecked: boolean) => {
    const next = new Set(enabled);
    if (isChecked) {
      next.add(condition);
    } else {
      next.delete(condition);
    }
    setEnabled(next);
    emit(kept, next);
  };

  const onValueChange = (patch: Partial<ReadyWhen>) => emit({ ...kept, ...patch }, enabled);

  return (
    <Accordion title={t(AnalyticsPipelinesI18nKey.ReadyWhenTitle)}>
      <div className="flex flex-col gap-4">
        <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.ReadyWhenTitleCaption)}</span>

        <div className="flex flex-col gap-2">
          <DialCheckbox
            id="pipeline-ready-idle-enabled"
            label={t(AnalyticsPipelinesI18nKey.ReadyWhenIdleLabel)}
            checked={enabled.has(ReadyWhenCondition.Idle)}
            onChange={(isChecked) => onToggle(ReadyWhenCondition.Idle, Boolean(isChecked))}
          />
          <div className={CONDITION_CONTROL_INDENT}>
            <DurationPresetField
              id="pipeline-ready-idle"
              label={t(AnalyticsPipelinesI18nKey.ReadyWhenIdle)}
              presets={IDLE_PRESETS}
              value={kept.idle}
              caption={t(AnalyticsPipelinesI18nKey.ReadyWhenIdleCaption)}
              isDisabled={!enabled.has(ReadyWhenCondition.Idle)}
              onChange={(idle) => onValueChange({ idle })}
            />
          </div>
        </div>

        {!isModal && (
          <div className="flex flex-col gap-2">
            <DialCheckbox
              id="pipeline-ready-signal-enabled"
              label={t(AnalyticsPipelinesI18nKey.ReadyWhenSignalLabel)}
              checked={enabled.has(ReadyWhenCondition.Signal)}
              onChange={(isChecked) => onToggle(ReadyWhenCondition.Signal, Boolean(isChecked))}
            />
            <div className={CONDITION_CONTROL_INDENT}>
              <SqlPredicateField
                id="pipeline-ready-signal"
                wrapperClassName="max-w-[420px]"
                label={t(AnalyticsPipelinesI18nKey.ReadyWhenSignal)}
                description={t(AnalyticsPipelinesI18nKey.ReadyWhenSignalCaption)}
                placeholder={t(AnalyticsPipelinesI18nKey.PredicateExample)}
                value={kept.signal}
                sourceName={sourceName}
                isCompact
                isDisabled={!enabled.has(ReadyWhenCondition.Signal)}
                onChange={(signal) => onValueChange({ signal })}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <DialCheckbox
            id="pipeline-ready-staleness-enabled"
            label={t(AnalyticsPipelinesI18nKey.ReadyWhenStalenessLabel)}
            checked={enabled.has(ReadyWhenCondition.MaxStaleness)}
            onChange={(isChecked) => onToggle(ReadyWhenCondition.MaxStaleness, Boolean(isChecked))}
          />
          <div className={CONDITION_CONTROL_INDENT}>
            <DurationPresetField
              id="pipeline-ready-max-staleness"
              label={t(AnalyticsPipelinesI18nKey.ReadyWhenMaxStaleness)}
              presets={MAX_STALENESS_PRESETS}
              value={kept.max_staleness}
              caption={t(AnalyticsPipelinesI18nKey.ReadyWhenStalenessCaption)}
              isDisabled={!enabled.has(ReadyWhenCondition.MaxStaleness)}
              onChange={(max_staleness) => onValueChange({ max_staleness })}
            />
          </div>
        </div>

        {!hasCondition && (
          <span className="text-error dial-tiny-text">{t(AnalyticsPipelinesI18nKey.ReadyWhenRequired)}</span>
        )}

        {/* A budget rather than a readiness condition, so it sits apart from the three above. */}
        <div className="flex flex-col gap-1 border-t border-secondary pt-4">
          <label htmlFor="pipeline-cost-ceiling" className="text-secondary dial-tiny-text">
            {t(AnalyticsPipelinesI18nKey.CostCeilingLabel)}
          </label>
          <DialInput
            id="pipeline-cost-ceiling"
            wrapperClassName={NUMBER_INPUT_WIDTH}
            type="number"
            min={1}
            value={kept.cost_ceiling == null ? '' : String(kept.cost_ceiling)}
            caption={t(AnalyticsPipelinesI18nKey.CostCeilingCaption)}
            error={isCostCeilingValid ? undefined : t(AnalyticsPipelinesI18nKey.CostCeilingInvalid)}
            invalid={!isCostCeilingValid}
            onChange={(value) => onValueChange({ cost_ceiling: value ? Number(value) : undefined })}
          />
        </div>
      </div>
    </Accordion>
  );
};

export default ReadyWhenEditor;
