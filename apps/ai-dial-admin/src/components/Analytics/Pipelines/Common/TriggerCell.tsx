import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineListItem, TriggerKind } from '@/src/models/analytics/pipeline';

const TRIGGER_LABEL: Record<TriggerKind, AnalyticsPipelinesI18nKey> = {
  [TriggerKind.Schedule]: AnalyticsPipelinesI18nKey.TriggerSchedule,
  [TriggerKind.Group]: AnalyticsPipelinesI18nKey.TriggerGroup,
};

const TRIGGER_COLOR: Record<TriggerKind, string> = {
  [TriggerKind.Schedule]: 'text-accent-primary',
  [TriggerKind.Group]: 'text-warning',
};

interface Props {
  pipeline?: PipelineListItem;
}

const TriggerCell: FC<Props> = ({ pipeline }) => {
  const t = useI18n();

  const trigger = pipeline?.trigger;

  // A pipeline registered before its trigger was chosen has none, which is an ordinary state.
  if (!trigger?.kind) {
    return <span className="text-secondary">{UNAVAILABLE_VALUE}</span>;
  }

  return <IdentityTag label={t(TRIGGER_LABEL[trigger.kind])} colorClassName={TRIGGER_COLOR[trigger.kind]} />;
};

export const TriggerCellRenderer: FC<ICellRendererParams<PipelineListItem>> = ({ data }) => (
  <TriggerCell pipeline={data} />
);

export default TriggerCell;
