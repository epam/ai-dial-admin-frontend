'use client';

import { FC } from 'react';

import Link from 'next/link';

import { evaluatorDetailHref } from '@/src/components/Analytics/Evaluators/utils';
import { tableDetailHref } from '@/src/components/Analytics/Tables/utils';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  readSource?: string;
}

const PipelineReadOnlyFacts: FC<Props> = ({ pipeline, readSource }) => {
  const t = useI18n();

  const createdAt = useLocalDateTimeString(pipeline.created_at);
  const updatedAt = useLocalDateTimeString(pipeline.updated_at);

  const notSet = t(AnalyticsPipelinesI18nKey.NotSet);
  const { evaluator } = pipeline;

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
      {evaluator && (
        <>
          <LabelledText label={t(AnalyticsPipelinesI18nKey.GrainKey)} text={pipeline.grain_key || notSet} />
          <LabelledText label={t(AnalyticsPipelinesI18nKey.VersionColumn)} text={pipeline.version_column || notSet} />
          <LabelledText label={t(AnalyticsPipelinesI18nKey.EvaluatorResolved)}>
            <Link
              href={evaluatorDetailHref(evaluator.name, evaluator.version)}
              className="text-accent-primary hover:underline"
            >
              {`${evaluator.name}@${evaluator.version}`}
            </Link>
          </LabelledText>
          <LabelledText label={t(AnalyticsPipelinesI18nKey.EvaluatorType)} text={evaluator.type} />
        </>
      )}
      <LabelledText label={t(AnalyticsPipelinesI18nKey.Generation)} text={String(pipeline.generation)} />
      <LabelledText label={t(AnalyticsPipelinesI18nKey.CreatedAt)} text={createdAt || notSet} />
      <LabelledText label={t(AnalyticsPipelinesI18nKey.Updated)} text={updatedAt || notSet} />
    </section>
  );
};

export default PipelineReadOnlyFacts;
