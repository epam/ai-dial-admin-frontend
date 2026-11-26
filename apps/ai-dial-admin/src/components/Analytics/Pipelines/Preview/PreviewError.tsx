'use client';

import { FC } from 'react';

import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  ElementSize,
  Notification,
  NotificationType,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';
import { IconDatabaseOff, IconLock } from '@tabler/icons-react';

import PreviewBannerBody from '@/src/components/Analytics/Pipelines/Preview/PreviewBannerBody';
import PreviewServerMessage from '@/src/components/Analytics/Pipelines/Preview/PreviewServerMessage';
import { SECTION_LABEL_KEYS } from '@/src/components/Analytics/Pipelines/Preview/constants';
import {
  PreviewFailure,
  PreviewFailureKind,
  PreviewSection,
} from '@/src/components/Analytics/Pipelines/Preview/models';
import { getRemedySection } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-state';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  failure: PreviewFailure;
  kind: PreviewFailureKind;
  pipeline: Pipeline;
  /** A result is held beneath the failure, so the failure says the run failed rather than that nothing is shown. */
  hasEarlierResult: boolean;
  onRun: () => void;
  onRunWithModel: () => void;
  onOpenSection: (section: PreviewSection) => void;
  onOpenRuntime: () => void;
}

const ICON_SIZE = 24;

type BannerKind = Exclude<PreviewFailureKind, PreviewFailureKind.NoAccess | PreviewFailureKind.Storage>;

const TITLE_KEYS: Record<BannerKind, PipelinePreviewI18nKey> = {
  [PreviewFailureKind.Validation]: PipelinePreviewI18nKey.ErrValidationTitle,
  [PreviewFailureKind.Budget]: PipelinePreviewI18nKey.ErrBudgetTitle,
  [PreviewFailureKind.Generic]: PipelinePreviewI18nKey.ErrGenericTitle,
  [PreviewFailureKind.ModelRunInProgress]: PipelinePreviewI18nKey.ErrInProgressTitle,
  [PreviewFailureKind.SpendBudget]: PipelinePreviewI18nKey.ErrSpendTitle,
  [PreviewFailureKind.RateLimited]: PipelinePreviewI18nKey.ErrRateTitle,
  [PreviewFailureKind.NotRunnable]: PipelinePreviewI18nKey.ErrNotRunnableTitle,
  [PreviewFailureKind.SampleUnavailable]: PipelinePreviewI18nKey.ErrSampleTitle,
  [PreviewFailureKind.ModelRunUnsupported]: PipelinePreviewI18nKey.ErrUnsupportedTitle,
};

const HINT_KEYS: Partial<Record<BannerKind, PipelinePreviewI18nKey>> = {
  [PreviewFailureKind.Validation]: PipelinePreviewI18nKey.ErrValidationHint,
  [PreviewFailureKind.Budget]: PipelinePreviewI18nKey.ErrBudgetHint,
  [PreviewFailureKind.ModelRunInProgress]: PipelinePreviewI18nKey.ErrInProgressBody,
  [PreviewFailureKind.SpendBudget]: PipelinePreviewI18nKey.ErrSpendBody,
  [PreviewFailureKind.RateLimited]: PipelinePreviewI18nKey.ErrRateBody,
  [PreviewFailureKind.NotRunnable]: PipelinePreviewI18nKey.ErrNotRunnableBody,
  [PreviewFailureKind.SampleUnavailable]: PipelinePreviewI18nKey.ErrSampleBody,
  [PreviewFailureKind.ModelRunUnsupported]: PipelinePreviewI18nKey.ErrUnsupportedBody,
};

const WARNING_KINDS = new Set<PreviewFailureKind>([
  PreviewFailureKind.Budget,
  PreviewFailureKind.ModelRunInProgress,
  PreviewFailureKind.SpendBudget,
  PreviewFailureKind.RateLimited,
]);

const MESSAGELESS_KINDS = new Set<PreviewFailureKind>([
  PreviewFailureKind.ModelRunInProgress,
  PreviewFailureKind.RateLimited,
  PreviewFailureKind.SampleUnavailable,
  PreviewFailureKind.ModelRunUnsupported,
]);

const variantOf = (kind: PreviewFailureKind): NotificationVariant => {
  if (kind === PreviewFailureKind.ModelRunUnsupported) return NotificationVariant.Info;

  return WARNING_KINDS.has(kind) ? NotificationVariant.Warning : NotificationVariant.Error;
};

const PreviewError: FC<Props> = ({
  failure,
  kind,
  pipeline,
  hasEarlierResult,
  onRun,
  onRunWithModel,
  onOpenSection,
  onOpenRuntime,
}) => {
  const t = useI18n();

  const onRetry = failure.isModelRun ? onRunWithModel : onRun;
  const retryLabel = t(failure.isModelRun ? PipelinePreviewI18nKey.RunAgainWithModel : PipelinePreviewI18nKey.RunAgain);

  const outlined = { variant: ButtonVariant.Neutral, appearance: ButtonAppearance.Outlined, size: ElementSize.Small };

  const sectionButton = (section: PreviewSection) => (
    <Button
      key={section}
      {...outlined}
      label={t(
        section === PreviewSection.Properties
          ? PipelinePreviewI18nKey.EmptyOpenProperties
          : SECTION_LABEL_KEYS[section],
      )}
      onClick={() => onOpenSection(section)}
    />
  );

  // No access is not a failed run: nothing on this page can fix it, so the tab explains and offers no run.
  if (kind === PreviewFailureKind.NoAccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <IconLock size={ICON_SIZE} className="text-secondary" aria-hidden />
        <h3 className="dial-h3">{t(PipelinePreviewI18nKey.NoAccessTitle)}</h3>
        <p className="max-w-[440px] text-secondary dial-small-text">{t(PipelinePreviewI18nKey.NoAccessBody)}</p>
        <PreviewServerMessage message={failure.message} />
      </div>
    );
  }

  if (kind === PreviewFailureKind.Storage) {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <IconDatabaseOff size={ICON_SIZE} className="text-error" aria-hidden />
        <h3 className="dial-h3">{t(PipelinePreviewI18nKey.ErrStorageTitle)}</h3>
        <p className="max-w-[440px] text-secondary dial-small-text">{t(PipelinePreviewI18nKey.ErrStorageBody)}</p>
        <Button {...outlined} label={t(PipelinePreviewI18nKey.TryAgain)} onClick={onRetry} />
      </div>
    );
  }

  const isRefused = kind === PreviewFailureKind.Validation || kind === PreviewFailureKind.Budget;
  const remedy = isRefused ? getRemedySection(kind, pipeline, failure.message) : undefined;

  const title =
    kind === PreviewFailureKind.Generic && failure.isModelRun
      ? PipelinePreviewI18nKey.ErrModelGenericTitle
      : TITLE_KEYS[kind];
  const hint = HINT_KEYS[kind];

  const actions = (() => {
    if (kind === PreviewFailureKind.ModelRunUnsupported) return undefined;
    if (kind === PreviewFailureKind.SpendBudget) {
      return <Button {...outlined} label={t(PipelinePreviewI18nKey.OpenRuntime)} onClick={onOpenRuntime} />;
    }
    if (kind === PreviewFailureKind.NotRunnable) return sectionButton(PreviewSection.Properties);
    if (remedy == null) return <Button {...outlined} label={retryLabel} onClick={onRetry} />;

    // A budget refusal offers the way into the declaration that makes the read light, and the declaration itself.
    return (
      <div className="flex flex-wrap gap-2">
        {sectionButton(remedy)}
        {kind === PreviewFailureKind.Budget &&
          remedy !== PreviewSection.Properties &&
          sectionButton(PreviewSection.Properties)}
      </div>
    );
  })();

  return (
    <Notification
      variant={variantOf(kind)}
      type={NotificationType.SectionMessage}
      role={kind === PreviewFailureKind.ModelRunUnsupported ? 'status' : 'alert'}
      message={
        <PreviewBannerBody title={t(title)}>
          {hint && <span className="text-secondary dial-tiny-text">{t(hint)}</span>}
          {hasEarlierResult && (
            <span className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.ErrLastRunFailed)}</span>
          )}
          {!MESSAGELESS_KINDS.has(kind) && <PreviewServerMessage message={failure.message} />}
          {kind === PreviewFailureKind.Generic && failure.code && (
            <span className="font-mono text-secondary dial-tiny-text">
              {t(PipelinePreviewI18nKey.ErrGenericCode, { code: failure.code })}
            </span>
          )}
        </PreviewBannerBody>
      }
      action={actions}
    />
  );
};

export default PreviewError;
