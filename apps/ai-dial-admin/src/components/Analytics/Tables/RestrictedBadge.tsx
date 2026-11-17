'use client';

import { Tag, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconColumns, IconFilter } from '@tabler/icons-react';
import { FC } from 'react';

import { RestrictionKind } from '@/src/components/Analytics/Tables/models';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  kind: RestrictionKind;
  hasTooltip?: boolean;
}

const LABELS: Record<RestrictionKind, AnalyticsTableAccessI18nKey> = {
  [RestrictionKind.Rows]: AnalyticsTableAccessI18nKey.RowsRestricted,
  [RestrictionKind.Columns]: AnalyticsTableAccessI18nKey.ColumnsRestricted,
};

const TOOLTIPS: Record<RestrictionKind, AnalyticsTableAccessI18nKey> = {
  [RestrictionKind.Rows]: AnalyticsTableAccessI18nKey.RowsRestrictedTooltip,
  [RestrictionKind.Columns]: AnalyticsTableAccessI18nKey.ColumnsRestrictedTooltip,
};

const ICONS: Record<RestrictionKind, typeof IconFilter> = {
  [RestrictionKind.Rows]: IconFilter,
  [RestrictionKind.Columns]: IconColumns,
};

// States the fact, never the limit.
const RestrictedBadge: FC<Props> = ({ kind, hasTooltip }) => {
  const t = useI18n();
  const Icon = ICONS[kind];

  return (
    <Tooltip tooltip={t(TOOLTIPS[kind])} hideTooltip={!hasTooltip}>
      <Tag label={t(LABELS[kind])} icon={<Icon size={14} aria-hidden />} />
    </Tooltip>
  );
};

export default RestrictedBadge;
