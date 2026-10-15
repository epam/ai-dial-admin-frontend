'use client';

import { FC } from 'react';

import { Button, ButtonAppearance, ButtonVariant, DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react';

import StatChip from '@/src/components/Analytics/QueryBuilder/Result/StatChip';
import { PREVIEW_GROUP_KEY_MAX_WIDTH_PX } from '@/src/components/Analytics/Pipelines/Preview/constants';
import { PreviewChip } from '@/src/components/Analytics/Pipelines/Preview/models';
import { formatCount } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-columns';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** Absent before the first run, when the bar carries the run control alone. */
  chips?: PreviewChip[];
  captionKey?: PipelinePreviewI18nKey;
  groupKey?: string;
  /** Set only when the last rerun moved to another group. */
  previousGroupKey?: string;
  isRunning: boolean;
  hasResult: boolean;
  hasUnsavedEdits: boolean;
  onRun: () => void;
}

const runLabelKey = (isRunning: boolean, hasResult: boolean, hasUnsavedEdits: boolean): PipelinePreviewI18nKey => {
  if (isRunning) return PipelinePreviewI18nKey.Running;
  if (hasUnsavedEdits) return PipelinePreviewI18nKey.RunOnSavedVersion;

  return hasResult ? PipelinePreviewI18nKey.RunAgain : PipelinePreviewI18nKey.RunPreview;
};

const PreviewRunBar: FC<Props> = ({
  chips = [],
  captionKey,
  groupKey,
  previousGroupKey,
  isRunning,
  hasResult,
  hasUnsavedEdits,
  onRun,
}) => {
  const t = useI18n();

  const chipValue = ({ count, total }: PreviewChip): string =>
    total == null
      ? formatCount(count)
      : t(PipelinePreviewI18nKey.ChipCountOfTotal, { count: formatCount(count), total: formatCount(total) });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {groupKey != null && (
            <>
              <StatChip
                label={t(PipelinePreviewI18nKey.GroupLabel)}
                value={
                  <div className="min-w-0" style={{ maxWidth: PREVIEW_GROUP_KEY_MAX_WIDTH_PX }}>
                    <DialEllipsisTooltip text={groupKey} className="font-mono" contentClassName="truncate" />
                  </div>
                }
              />
              {previousGroupKey != null && (
                <div className="min-w-0" style={{ maxWidth: PREVIEW_GROUP_KEY_MAX_WIDTH_PX }}>
                  <DialEllipsisTooltip
                    text={t(PipelinePreviewI18nKey.GroupWas, { key: previousGroupKey })}
                    className="text-secondary dial-tiny-text"
                    contentClassName="truncate"
                  />
                </div>
              )}
            </>
          )}
          {chips.map((chip) => (
            <StatChip key={chip.labelKey} value={chipValue(chip)} label={t(chip.labelKey)} />
          ))}
        </div>
        <Button
          variant={hasResult ? ButtonVariant.Neutral : ButtonVariant.Primary}
          appearance={hasResult ? ButtonAppearance.Outlined : undefined}
          label={t(runLabelKey(isRunning, hasResult, hasUnsavedEdits))}
          iconBefore={
            hasResult ? (
              <IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />
            ) : (
              <IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} aria-hidden />
            )
          }
          disabled={isRunning}
          onClick={onRun}
        />
      </div>
      {captionKey && <span className="text-secondary dial-tiny-text">{t(captionKey)}</span>}
    </div>
  );
};

export default PreviewRunBar;
