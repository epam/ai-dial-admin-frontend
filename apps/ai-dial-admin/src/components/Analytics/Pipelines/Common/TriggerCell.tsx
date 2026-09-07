import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PipelineListItem, TriggerKind } from '@/src/models/analytics/pipeline';

const TRIGGER_LABEL: Record<TriggerKind, AnalyticsPipelinesI18nKey> = {
  [TriggerKind.OnIngest]: AnalyticsPipelinesI18nKey.TriggerOnIngest,
  [TriggerKind.Schedule]: AnalyticsPipelinesI18nKey.TriggerSchedule,
  [TriggerKind.Group]: AnalyticsPipelinesI18nKey.TriggerGroup,
};

const TRIGGER_COLOR: Record<TriggerKind, string> = {
  [TriggerKind.OnIngest]: 'text-info',
  [TriggerKind.Schedule]: 'text-accent-primary',
  [TriggerKind.Group]: 'text-warning',
};

interface Props {
  pipeline?: PipelineListItem;
}

const TriggerCell: FC<Props> = ({ pipeline }) => {
  const t = useI18n();

  const trigger = pipeline?.trigger;

  if (!trigger?.kind) {
    return null;
  }

  return (
    <span className="flex flex-col justify-center leading-tight">
      <span
        className={classNames(
          'inline-block w-fit rounded bg-layer-4 px-2 py-0.5 font-semibold uppercase dial-tiny-text',
          TRIGGER_COLOR[trigger.kind],
        )}
      >
        {t(TRIGGER_LABEL[trigger.kind])}
      </span>
    </span>
  );
};

export const TriggerCellRenderer: FC<ICellRendererParams<PipelineListItem>> = ({ data }) => (
  <TriggerCell pipeline={data} />
);

export default TriggerCell;
