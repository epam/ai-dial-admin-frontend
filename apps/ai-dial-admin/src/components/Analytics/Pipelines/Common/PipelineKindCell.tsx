import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineKind, PipelineListItem } from '@/src/models/analytics/pipeline';

const KIND_LABEL: Record<PipelineKind, AnalyticsPipelinesI18nKey> = {
  [PipelineKind.Enrich]: AnalyticsPipelinesI18nKey.KindEnrich,
  [PipelineKind.Aggregate]: AnalyticsPipelinesI18nKey.KindAggregate,
};

const KIND_COLOR: Record<PipelineKind, string> = {
  [PipelineKind.Enrich]: 'text-accent-secondary',
  [PipelineKind.Aggregate]: 'text-accent-tertiary',
};

interface Props {
  kind?: PipelineKind;
}

const PipelineKindCell: FC<Props> = ({ kind }) => {
  const t = useI18n();

  if (!kind) {
    return null;
  }

  return <IdentityTag label={t(KIND_LABEL[kind])} colorClassName={KIND_COLOR[kind]} />;
};

export const PipelineKindCellRenderer: FC<ICellRendererParams<PipelineListItem>> = ({ data }) => (
  <PipelineKindCell kind={data?.kind} />
);

export default PipelineKindCell;
