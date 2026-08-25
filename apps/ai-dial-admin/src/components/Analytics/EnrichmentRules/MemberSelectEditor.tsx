'use client';

import { FC } from 'react';

import { DialInput } from '@epam/ai-dial-ui-kit';

import OrderByEditor from '@/src/components/Analytics/EnrichmentRules/OrderByEditor';
import SqlPredicateField from '@/src/components/Analytics/EnrichmentRules/SqlPredicateField';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { GROUP_FETCH_MAX_ROWS, NUMBER_INPUT_WIDTH } from '@/src/constants/analytics/enrichment-rules';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MemberSelect } from '@/src/models/analytics/rule';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

interface Props {
  memberSelect?: MemberSelect;
  columns: AnalyticsTableColumn[];
  sourceName?: string;
  isLimitValid: boolean;
  onChange: (memberSelect?: MemberSelect) => void;
}

/**
 * `limit` is required whenever `member_select` is present, so clearing every member drops the object rather
 * than sending one the service would reject.
 */
const MemberSelectEditor: FC<Props> = ({ memberSelect, columns, sourceName, isLimitValid, onChange }) => {
  const t = useI18n();

  const update = (patch: Partial<MemberSelect>) => {
    const next = { ...memberSelect, ...patch } as MemberSelect;
    const isEmpty = !next.limit && !next.prefer_sql?.trim() && !next.order_by?.length;
    onChange(isEmpty ? undefined : next);
  };

  return (
    <div className="flex flex-col gap-4">
      <SqlPredicateField
        className={STANDARD_CONTROL_WIDTH}
        id="rule-prefer-sql"
        label={t(AnalyticsEnrichmentRulesI18nKey.PreferSql)}
        description={t(AnalyticsEnrichmentRulesI18nKey.PreferSqlCaption)}
        value={memberSelect?.prefer_sql}
        sourceName={sourceName}
        onChange={(prefer_sql) => update({ prefer_sql })}
      />

      <div className="flex flex-col gap-2">
        <span className="text-primary dial-small">{t(AnalyticsEnrichmentRulesI18nKey.OrderBy)}</span>
        <OrderByEditor
          orderBy={memberSelect?.order_by}
          columns={columns}
          onChange={(order_by) => update({ order_by })}
        />
      </div>

      <DialInput
        containerClassName={STANDARD_CONTROL_WIDTH}
        wrapperClassName={NUMBER_INPUT_WIDTH}
        id="rule-member-limit"
        type="number"
        min={1}
        max={GROUP_FETCH_MAX_ROWS}
        labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.MemberLimit), required: Boolean(memberSelect) }}
        value={memberSelect?.limit == null ? '' : String(memberSelect.limit)}
        caption={t(AnalyticsEnrichmentRulesI18nKey.MemberLimitCaption)}
        error={isLimitValid ? undefined : t(AnalyticsEnrichmentRulesI18nKey.MemberLimitRequired)}
        invalid={!isLimitValid}
        onChange={(v) => update({ limit: v ? Number(v) : undefined })}
      />
    </div>
  );
};

export default MemberSelectEditor;
