'use client';

import { FC } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconFilter, IconRefresh } from '@tabler/icons-react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import CopyableText from '@/src/components/Common/CopyableText/CopyableText';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { errorLines, pathOf, scopeOf } from '@/src/components/Analytics/Pipelines/Failures/failures';
import { DLQ_STAGE_DESCRIPTION } from '@/src/constants/analytics/pipeline-dlq';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { DlqItem, DlqLane, DlqScope } from '@/src/models/analytics/pipeline-dlq';
import { TriggerKind } from '@/src/models/analytics/pipeline';

/** The value typography the shared labelled field uses, for the fields this detail renders itself. */
const VALUE_TEXT = 'dial-small-text text-primary';

interface Props {
  item: DlqItem;
  trigger?: TriggerKind;
  /** The run the grid is already narrowed to, so the detail does not offer to narrow to it again. */
  filteredRunId?: string;
  isBusy: boolean;
  /**
   * How many of this run's failures the service would re-run, or undefined while that is still being
   * read. One number, asked of the service, so the control and its confirmation cannot disagree.
   */
  runRetryableCount?: number;
  onFilterByRun: (runId: string) => void;
  onRetryRun: (runId: string, count: number) => void;
}

const SCOPE_LABEL: Record<DlqScope, AnalyticsPipelinesI18nKey> = {
  [DlqScope.Chunk]: AnalyticsPipelinesI18nKey.FailuresScopeChunk,
  [DlqScope.Row]: AnalyticsPipelinesI18nKey.FailuresScopeRow,
  [DlqScope.Write]: AnalyticsPipelinesI18nKey.FailuresScopeWrite,
};

const SCOPE_HINT: Record<DlqScope, AnalyticsPipelinesI18nKey> = {
  [DlqScope.Chunk]: AnalyticsPipelinesI18nKey.FailuresScopeChunkHint,
  [DlqScope.Row]: AnalyticsPipelinesI18nKey.FailuresScopeRowHint,
  [DlqScope.Write]: AnalyticsPipelinesI18nKey.FailuresScopeWriteHint,
};

const PATH_LABEL: Record<DlqLane, AnalyticsPipelinesI18nKey> = {
  [DlqLane.Live]: AnalyticsPipelinesI18nKey.FailuresPathLive,
  [DlqLane.Backfill]: AnalyticsPipelinesI18nKey.FailuresPathBackfill,
};

/**
 * One failure, opened in place.
 *
 * The message is the reason the detail exists: the row truncates it to a line, and a schema rejection
 * arrives as every violation joined into one string. Here it is whole, wrapped, one violation per
 * line, and copyable — which is also what makes the truncation in the row acceptable to a keyboard
 * reader. The absolute time is stated here for the same reason: the row states an age, and the exact
 * instant is what a log search needs.
 *
 * It is ordinary presentation and knows nothing about the grid. Sizing the row it occupies is the
 * grid's job, through `getRowHeight`.
 */
const FailureRowDetail: FC<Props> = ({
  item,
  trigger,
  filteredRunId,
  isBusy,
  runRetryableCount,
  onFilterByRun,
  onRetryRun,
}) => {
  const t = useI18n();

  const failedAt = useLocalDateTimeString(item.created_at);
  const scope = scopeOf(item, trigger);
  const lines = errorLines(item.error);

  const grainKeyText =
    item.grain_key ??
    t(
      scope === DlqScope.Write
        ? AnalyticsPipelinesI18nKey.FailuresGrainWriteItem
        : AnalyticsPipelinesI18nKey.FailuresGrainWholeChunk,
    );

  return (
    <div className="flex flex-col gap-4 bg-layer-2 px-4 py-4">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
        {/* The copy sits right after the value rather than at the column's far edge, where the shared field
            places its postfix. */}
        <LabelledText label={t(AnalyticsPipelinesI18nKey.FailuresId)}>
          <CopyableText
            value={String(item.id)}
            copyLabel={t(AnalyticsPipelinesI18nKey.FailuresId)}
            textClassName={VALUE_TEXT}
          />
        </LabelledText>
        {scope && (
          <LabelledText
            label={t(AnalyticsPipelinesI18nKey.FailuresScope)}
            text={t(AnalyticsPipelinesI18nKey.FailuresScopeValue, {
              scope: t(SCOPE_LABEL[scope]),
              hint: t(SCOPE_HINT[scope]),
            })}
          />
        )}
        <LabelledText
          label={t(AnalyticsPipelinesI18nKey.FailuresStage)}
          text={t(AnalyticsPipelinesI18nKey.FailuresStageValue, {
            stage: item.stage,
            description: t(DLQ_STAGE_DESCRIPTION[item.stage]),
          })}
        />
        <LabelledText label={t(AnalyticsPipelinesI18nKey.FailuresPath)} text={t(PATH_LABEL[pathOf(item)])} />
        <LabelledText label={t(AnalyticsPipelinesI18nKey.FailuresFailedAt)} text={failedAt} />
        {/* Plain text, not a link: the console has no page for a backfill run to link to. */}
        {item.run_id && <LabelledText label={t(AnalyticsPipelinesI18nKey.FailuresRun)} text={item.run_id} />}
        {item.grain_key ? (
          <LabelledText label={t(AnalyticsPipelinesI18nKey.FailuresGrainKey)}>
            <CopyableText
              value={item.grain_key}
              copyLabel={t(AnalyticsPipelinesI18nKey.FailuresGrainKey)}
              textClassName={VALUE_TEXT}
            />
          </LabelledText>
        ) : (
          <LabelledText label={t(AnalyticsPipelinesI18nKey.FailuresGrainKey)} text={grainKeyText} />
        )}
        {item.pipeline_generation != null && (
          <LabelledText
            label={t(AnalyticsPipelinesI18nKey.FailuresGeneration)}
            text={String(item.pipeline_generation)}
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="dial-tiny-text text-secondary">{t(AnalyticsPipelinesI18nKey.FailuresError)}</span>
        <div className="relative rounded bg-layer-4 p-3 pr-10">
          {/* Fixed to the corner rather than following the last line, so it stays in one place however the
              message wraps. The right padding keeps the text out from under it. */}
          {lines.length > 0 && (
            <CopyButton
              className="absolute right-2 top-2"
              value={item.error ?? ''}
              valueLabel={t(AnalyticsPipelinesI18nKey.FailuresError)}
              size={ElementSize.Small}
            />
          )}
          <div className="flex min-w-0 flex-col gap-1">
            {lines.length ? (
              // `anywhere` rather than `break-word`: only it lowers the line's minimum width, so a URL with no
              // break opportunity wraps inside the block instead of running under its edge. `whitespace-normal`
              // because the code typography class sets `nowrap`, which switches wrapping off altogether.
              lines.map((line, index) => (
                <span
                  key={`${index}-${line}`}
                  className="dial-code-text whitespace-normal text-error [overflow-wrap:anywhere]"
                >
                  {line}
                </span>
              ))
            ) : (
              // The column is nullable and some exceptions carry no message; saying so beats a blank.
              <span className="dial-small-text text-secondary">{t(AnalyticsPipelinesI18nKey.FailuresNoMessage)}</span>
            )}
          </div>
        </div>
      </div>

      {item.run_id && (
        <div className="flex flex-row flex-wrap items-center justify-end gap-3">
          {filteredRunId !== item.run_id && (
            <Button
              variant={ButtonVariant.Neutral}
              appearance={ButtonAppearance.Outlined}
              size={ElementSize.Small}
              label={t(AnalyticsPipelinesI18nKey.FailuresFilterByRun)}
              iconBefore={<IconFilter {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              onClick={() => onFilterByRun(item.run_id as string)}
            />
          )}
          {/* Offered on the run's own population rather than on this row's: the re-run is scoped to the
              run, so a poison row opened first must not hide an action that would re-run four hundred
              others. Withheld only while the count is unknown, or when the run has nothing to send. */}
          {!!runRetryableCount && (
            <Button
              variant={ButtonVariant.Primary}
              size={ElementSize.Small}
              label={t(AnalyticsPipelinesI18nKey.FailuresRetryRun, { count: runRetryableCount })}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              disabled={isBusy}
              onClick={() => onRetryRun(item.run_id as string, runRetryableCount as number)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FailureRowDetail;
