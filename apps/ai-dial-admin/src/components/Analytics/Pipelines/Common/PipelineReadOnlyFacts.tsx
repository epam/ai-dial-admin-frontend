'use client';

import { FC } from 'react';

import Link from 'next/link';

import { tableDetailHref } from '@/src/components/Analytics/Tables/utils';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Pipeline, PipelineKind } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  readSource?: string;
}

const PipelineReadOnlyFacts: FC<Props> = ({ pipeline, readSource }) => {
  const t = useI18n();

  const createdAt = useLocalDateTimeString(pipeline.created_at);
  const updatedAt = useLocalDateTimeString(pipeline.updated_at);

  const notSet = t(AnalyticsPipelinesI18nKey.NotSet);

  // The field list rather than the document: the document is already in the JSON editor, and the names
  // are what an operator compares against the target's columns.
  const isEnrich = pipeline.kind === PipelineKind.Enrich;
  const schemaFields = Object.keys((pipeline.response_schema?.properties as Record<string, unknown> | undefined) ?? {});

  return (
    <section
      aria-label={t(AnalyticsPipelinesI18nKey.ReadOnlyFacts)}
      className="flex flex-row flex-wrap gap-8 pb-8 border-b border-primary"
    >
      <LabelledText label={t(AnalyticsPipelinesI18nKey.Target)}>
        <Link href={tableDetailHref(pipeline.target)} className="text-accent-primary hover:underline">
          {pipeline.target}
        </Link>
      </LabelledText>
      <LabelledText label={t(AnalyticsPipelinesI18nKey.Source)}>
        {readSource ? (
          <Link href={tableDetailHref(readSource)} className="text-accent-primary hover:underline">
            {readSource}
          </Link>
        ) : (
          notSet
        )}
      </LabelledText>
      {isEnrich && (
        <>
          <LabelledText label={t(AnalyticsPipelinesI18nKey.GrainKey)} text={pipeline.grain_key || notSet} />
          <LabelledText label={t(AnalyticsPipelinesI18nKey.VersionColumn)} text={pipeline.version_column || notSet} />
          <LabelledText
            label={t(AnalyticsPipelinesI18nKey.ResponseSchema)}
            text={schemaFields.length ? schemaFields.join(', ') : notSet}
          />
        </>
      )}
      <LabelledText label={t(AnalyticsPipelinesI18nKey.Generation)} text={String(pipeline.generation)} />
      <LabelledText label={t(AnalyticsPipelinesI18nKey.CreatedAt)} text={createdAt || notSet} />
      <LabelledText label={t(AnalyticsPipelinesI18nKey.Updated)} text={updatedAt || notSet} />
    </section>
  );
};

export default PipelineReadOnlyFacts;
