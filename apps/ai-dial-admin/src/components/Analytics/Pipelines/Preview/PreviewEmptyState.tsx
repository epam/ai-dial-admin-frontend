'use client';

import { FC, useCallback } from 'react';

import { Button, ButtonAppearance, ButtonVariant, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { tableDetailHref } from '@/src/components/Analytics/Tables/utils';
import { PreviewEmptyKind, PreviewSection } from '@/src/components/Analytics/Pipelines/Preview/models';
import { findNote } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-state';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { Pipeline, PipelineKind } from '@/src/models/analytics/pipeline';
import { PipelinePreview, PreviewNoteCode } from '@/src/models/analytics/pipeline-preview';

interface Props {
  kind: PreviewEmptyKind;
  preview: PipelinePreview;
  pipeline: Pipeline;
  onOpenSection: (section: PreviewSection) => void;
}

interface EmptyCopy {
  title: PipelinePreviewI18nKey;
  body: PipelinePreviewI18nKey;
  args?: Record<string, string>;
}

const copyOf = (kind: PreviewEmptyKind, pipeline: Pipeline, enrichment?: string): EmptyCopy => {
  const isAggregate = pipeline.kind === PipelineKind.Aggregate;

  switch (kind) {
    case PreviewEmptyKind.NoData:
      return {
        title: PipelinePreviewI18nKey.EmptyNoDataTitle,
        body: isAggregate ? PipelinePreviewI18nKey.EmptyNoDataBodyAggregate : PipelinePreviewI18nKey.EmptyNoDataBody,
        args: { input: (pipeline.inputs ?? []).join(', ') },
      };
    case PreviewEmptyKind.NoMatch:
      return {
        title: PipelinePreviewI18nKey.EmptyNoMatchTitle,
        body: isAggregate ? PipelinePreviewI18nKey.EmptyNoMatchBodyAggregate : PipelinePreviewI18nKey.EmptyNoMatchBody,
        args: { filter: pipeline.filter ?? '' },
      };
    case PreviewEmptyKind.NoGroup:
      return {
        title: PipelinePreviewI18nKey.EmptyNoGroupTitle,
        body: PipelinePreviewI18nKey.EmptyNoGroupBody,
        args: { column: pipeline.trigger?.group_by ?? '' },
      };
    case PreviewEmptyKind.Held:
      return {
        title: PipelinePreviewI18nKey.EmptyHeldTitle,
        body: enrichment ? PipelinePreviewI18nKey.EmptyHeldBody : PipelinePreviewI18nKey.EmptyHeldBodyUnnamed,
        args: enrichment ? { enrichment } : undefined,
      };
  }
};

/**
 * Why there is nothing to show, from the service's own note, with the action that addresses it. No data and a
 * filter that excludes everything are told apart by the saved declaration, which is the only place that knows.
 */
const PreviewEmptyState: FC<Props> = ({ kind, preview, pipeline, onOpenSection }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const enrichment = findNote(preview.notes, PreviewNoteCode.HeldByEnrichment)?.subject;
  const copy = copyOf(kind, pipeline, enrichment);

  const onOpenProperties = useCallback(() => onOpenSection(PreviewSection.Properties), [onOpenSection]);
  const onOpenEnrichment = useCallback(() => {
    if (enrichment) window.open(`/${currentLocale}${tableDetailHref(enrichment)}`, '_blank');
  }, [currentLocale, enrichment]);

  const isFilterProblem = kind === PreviewEmptyKind.NoMatch || kind === PreviewEmptyKind.NoGroup;

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <h3 className="dial-h3">{t(copy.title)}</h3>
      <p className="max-w-[440px] text-secondary dial-small-text">{t(copy.body, copy.args)}</p>
      {isFilterProblem && (
        <Button
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
          size={ElementSize.Small}
          label={t(PipelinePreviewI18nKey.EmptyOpenProperties)}
          onClick={onOpenProperties}
        />
      )}
      {kind === PreviewEmptyKind.Held && enrichment && (
        <Button
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
          size={ElementSize.Small}
          label={t(PipelinePreviewI18nKey.EmptyOpenEnrichment, { name: enrichment })}
          iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          onClick={onOpenEnrichment}
        />
      )}
    </div>
  );
};

export default PreviewEmptyState;
