import { FC } from 'react';

import { DialCheckbox, DialSwitch } from '@epam/ai-dial-ui-kit';

import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { PAGE_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryMode, QueryPageType } from '@/src/models/analytics/query';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { QueryBuilderColor } from '@/src/models/analytics/query-builder';

const PageSection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();
  const { page } = state;
  const isOffset = page.type === QueryPageType.Offset;
  // The service computes totals only for row-mode offset paging — the toggle is meaningless elsewhere.
  const supportsTotal = isOffset && state.mode === QueryMode.Row;

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.Page)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Numeric].marker}
      action={
        <DialSwitch
          switchId="qb-page-enabled"
          label={t(QueryBuilderI18nKey.IncludePage)}
          isOn={page.enabled}
          onChange={(value) => {
            page.enabled = value;
            refresh();
          }}
        />
      }
    >
      {page.enabled && (
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="w-[92px] shrink-0">
            <CompactSelect
              ariaLabel={t(QueryBuilderI18nKey.Strategy)}
              options={PAGE_TYPE_OPTIONS}
              value={page.type}
              onChange={(v) => {
                page.type = v as QueryPageType;
                refresh();
              }}
            />
          </div>

          {isOffset ? (
            <>
              <CompactInput
                ariaLabel={t(QueryBuilderI18nKey.Offset)}
                prefix={t(QueryBuilderI18nKey.Offset)}
                className="w-[110px]"
                numeric
                value={String(page.offset)}
                onChange={(value) => {
                  page.offset = Number(value || 0);
                  refresh();
                }}
              />
              <CompactInput
                ariaLabel={t(QueryBuilderI18nKey.Limit)}
                prefix={t(QueryBuilderI18nKey.Limit)}
                className="w-[100px]"
                numeric
                value={String(page.limit)}
                onChange={(value) => {
                  page.limit = Number(value || 0);
                  refresh();
                }}
              />
            </>
          ) : (
            <>
              <CompactInput
                ariaLabel={t(QueryBuilderI18nKey.Cursor)}
                prefix={t(QueryBuilderI18nKey.Cursor)}
                className="min-w-[140px] flex-1"
                value={page.cursor}
                onChange={(value) => {
                  page.cursor = value;
                  refresh();
                }}
              />
              <CompactInput
                ariaLabel={t(QueryBuilderI18nKey.Limit)}
                prefix={t(QueryBuilderI18nKey.Limit)}
                className="w-[100px]"
                numeric
                value={String(page.cursorLimit)}
                onChange={(value) => {
                  page.cursorLimit = Number(value || 0);
                  refresh();
                }}
              />
            </>
          )}

          {supportsTotal && (
            <DialCheckbox
              id="qb-page-total"
              label={t(QueryBuilderI18nKey.IncludeTotal)}
              checked={page.includeTotal}
              onChange={(value) => {
                page.includeTotal = !!value;
                refresh();
              }}
            />
          )}
        </div>
      )}
    </SectionBlock>
  );
};

export default PageSection;
