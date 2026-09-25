'use client';
import { FC } from 'react';
import AggregateSection from '@/src/components/Analytics/Pipelines/Aggregate/AggregateSection';
import { useAggregateForm } from '@/src/components/Analytics/Pipelines/Aggregate/use-aggregate-form';
import PipelineDetailFrame from '@/src/components/Analytics/Pipelines/Common/PipelineDetailFrame';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';
interface Props {
  pipeline: Pipeline;
  takenTargets: string[];
  functions?: QueryFunction[];
}
const AggregateDetailView: FC<Props> = ({ pipeline, takenTargets, functions = [] }) => {
  const form = useAggregateForm({ pipeline, takenTargets });
  return (
    <PipelineDetailFrame pipeline={pipeline} form={form}>
      <AggregateSection form={form} functions={functions} />
    </PipelineDetailFrame>
  );
};
export default AggregateDetailView;
