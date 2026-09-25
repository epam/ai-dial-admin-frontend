'use client';

import { FC } from 'react';

import PipelineDetailFrame from '@/src/components/Analytics/Pipelines/Common/PipelineDetailFrame';
import EnrichSection from '@/src/components/Analytics/Pipelines/Enrich/EnrichSection';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  takenTargets: string[];
}

const EnrichDetailView: FC<Props> = ({ pipeline, takenTargets }) => {
  const form = useEnrichForm({ pipeline, takenTargets });

  return (
    <PipelineDetailFrame pipeline={pipeline} form={form}>
      <EnrichSection form={form} />
    </PipelineDetailFrame>
  );
};

export default EnrichDetailView;
