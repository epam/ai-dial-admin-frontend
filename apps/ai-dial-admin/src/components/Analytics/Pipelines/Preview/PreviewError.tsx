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
import classNames from 'classnames';

import PreviewBannerBody from '@/src/components/Analytics/Pipelines/Preview/PreviewBannerBody';
import { SECTION_LABEL_KEYS } from '@/src/components/Analytics/Pipelines/Preview/constants';
import {
  PreviewFailure,
  PreviewFailureKind,
  PreviewSection,
} from '@/src/components/Analytics/Pipelines/Preview/models';
import { getRemedySection } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-state';
import { NOTIFICATION_MESSAGE_WRAP_CLASS } from '@/src/constants/analytics/pipelines';
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
  onOpenSection: (section: PreviewSection) => void;
}

const ICON_SIZE = 24;

/** The service's own words, untouched, where the reader can select and copy them. */
const ServerMessage: FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p
      className={classNames(
        'rounded bg-layer-1 px-2.5 py-2 font-mono dial-tiny-text text-primary',
        NOTIFICATION_MESSAGE_WRAP_CLASS,
      )}
    >
      {message}
    </p>
  ) : null;

const PreviewError: FC<Props> = ({ failure, kind, pipeline, hasEarlierResult, onRun, onOpenSection }) => {
  const t = useI18n();

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
        <ServerMessage message={failure.message} />
      </div>
    );
  }

  if (kind === PreviewFailureKind.Storage) {
    return (
      <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <IconDatabaseOff size={ICON_SIZE} className="text-error" aria-hidden />
        <h3 className="dial-h3">{t(PipelinePreviewI18nKey.ErrStorageTitle)}</h3>
        <p className="max-w-[440px] text-secondary dial-small-text">{t(PipelinePreviewI18nKey.ErrStorageBody)}</p>
        <Button {...outlined} label={t(PipelinePreviewI18nKey.TryAgain)} onClick={onRun} />
      </div>
    );
  }

  const isRefused = kind === PreviewFailureKind.Validation || kind === PreviewFailureKind.Budget;
  const remedy = isRefused ? getRemedySection(kind, pipeline, failure.message) : undefined;

  const title = {
    [PreviewFailureKind.Validation]: PipelinePreviewI18nKey.ErrValidationTitle,
    [PreviewFailureKind.Budget]: PipelinePreviewI18nKey.ErrBudgetTitle,
    [PreviewFailureKind.Generic]: PipelinePreviewI18nKey.ErrGenericTitle,
  }[kind];

  const hint = {
    [PreviewFailureKind.Validation]: PipelinePreviewI18nKey.ErrValidationHint,
    [PreviewFailureKind.Budget]: PipelinePreviewI18nKey.ErrBudgetHint,
    [PreviewFailureKind.Generic]: undefined,
  }[kind];

  // A budget refusal offers the way into the declaration that makes the read light, and the declaration itself.
  const actions =
    remedy == null ? (
      <Button {...outlined} label={t(PipelinePreviewI18nKey.RunAgain)} onClick={onRun} />
    ) : (
      <div className="flex flex-wrap gap-2">
        {sectionButton(remedy)}
        {kind === PreviewFailureKind.Budget &&
          remedy !== PreviewSection.Properties &&
          sectionButton(PreviewSection.Properties)}
      </div>
    );

  return (
    <Notification
      variant={kind === PreviewFailureKind.Budget ? NotificationVariant.Warning : NotificationVariant.Error}
      type={NotificationType.SectionMessage}
      role="alert"
      message={
        <PreviewBannerBody title={t(title)}>
          {hint && <span className="text-secondary dial-tiny-text">{t(hint)}</span>}
          {hasEarlierResult && (
            <span className="text-secondary dial-tiny-text">{t(PipelinePreviewI18nKey.ErrLastRunFailed)}</span>
          )}
          <ServerMessage message={failure.message} />
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
