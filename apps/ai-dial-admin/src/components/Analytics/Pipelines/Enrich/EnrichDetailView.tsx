'use client';

import { FC } from 'react';

import PipelineDetailFrame from '@/src/components/Analytics/Pipelines/Common/PipelineDetailFrame';
import EnrichSection from '@/src/components/Analytics/Pipelines/Enrich/EnrichSection';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  takenTargets: string[];
  hasGroups?: boolean;
}

const EnrichDetailView: FC<Props> = ({ pipeline, takenTargets, hasGroups }) => {
  const form = useEnrichForm({ pipeline, takenTargets });

  return (
    <PipelineDetailFrame pipeline={pipeline} form={form} hasGroups={hasGroups}>
      <EnrichSection form={form} />
    </PipelineDetailFrame>
  );
};

export default EnrichDetailView;
