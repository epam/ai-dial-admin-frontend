import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import EvaluatorTypeBadge from '@/src/components/Analytics/Evaluators/EvaluatorTypeBadge';
import { isPinnedToLatest } from '@/src/components/Analytics/Pipelines/Common/utils';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineListItem } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline?: PipelineListItem;
}

const EvaluatorCell: FC<Props> = ({ pipeline }) => {
  const t = useI18n();

  const name = pipeline?.evaluator_name;

  if (!name) {
    return null;
  }

  const version = pipeline.evaluator?.version ?? pipeline.evaluator_version;

  return (
    <span className="flex items-center gap-x-1.5">
      <span className="truncate">{version == null ? name : `${name}@${version}`}</span>
      {isPinnedToLatest(pipeline.evaluator_version) && (
        <span className="shrink-0 text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.Latest)}</span>
      )}
      {pipeline.evaluator && <EvaluatorTypeBadge type={pipeline.evaluator.type} />}
    </span>
  );
};

export const EvaluatorCellRenderer: FC<ICellRendererParams<PipelineListItem>> = ({ data }) => (
  <EvaluatorCell pipeline={data} />
);

export default EvaluatorCell;
