import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';

const TRIGGER_LABEL: Record<TriggerKind, AnalyticsEnrichmentRulesI18nKey> = {
  [TriggerKind.OnIngest]: AnalyticsEnrichmentRulesI18nKey.TriggerOnIngest,
  [TriggerKind.Schedule]: AnalyticsEnrichmentRulesI18nKey.TriggerSchedule,
  [TriggerKind.Group]: AnalyticsEnrichmentRulesI18nKey.TriggerGroup,
};

const TRIGGER_COLOR: Record<TriggerKind, string> = {
  [TriggerKind.OnIngest]: 'text-info',
  [TriggerKind.Schedule]: 'text-accent-primary',
  [TriggerKind.Group]: 'text-warning',
};

interface Props {
  rule?: EnrichmentRuleListItem;
}

const TriggerCell: FC<Props> = ({ rule }) => {
  const t = useI18n();

  if (!rule?.trigger_kind) {
    return null;
  }

  const qualifier =
    rule.trigger_kind === TriggerKind.Schedule
      ? rule.trigger_cron
      : rule.group_by && t(AnalyticsEnrichmentRulesI18nKey.GroupedBy, { column: rule.group_by });

  return (
    <span className="flex flex-col justify-center leading-tight">
      <span
        className={classNames(
          'inline-block w-fit rounded bg-layer-4 px-2 py-0.5 font-semibold uppercase dial-tiny-text',
          TRIGGER_COLOR[rule.trigger_kind],
        )}
      >
        {t(TRIGGER_LABEL[rule.trigger_kind])}
      </span>
      {qualifier && <span className="truncate text-secondary dial-tiny-text">{qualifier}</span>}
    </span>
  );
};

export const TriggerCellRenderer: FC<ICellRendererParams<EnrichmentRuleListItem>> = ({ data }) => (
  <TriggerCell rule={data} />
);

export default TriggerCell;
