import { FC } from 'react';

import { DialCheckbox, DialInput, DialNumberInput, DialSelectField, DialSwitch } from '@epam/ai-dial-ui-kit';

import { PAGE_TYPE_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { QueryPageType } from '@/src/models/analytics/query';

const PageSection: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();
  const { page } = state;
  const isOffset = page.type === QueryPageType.Offset;

  return (
    <div className={STANDARD_CONTROL_WIDTH}>
      <div className="flex flex-col gap-3">
        <DialSwitch
          switchId="qb-page-enabled"
          label={t(QueryBuilderI18nKey.IncludePage)}
          isOn={page.enabled}
          onChange={(value) => {
            page.enabled = value;
            refresh();
          }}
        />

        {page.enabled && (
          <>
            <div className="flex items-end gap-2">
              <DialSelectField
                id="qb-page-strategy"
                containerClassName="w-[112px] shrink-0"
                label={t(QueryBuilderI18nKey.Strategy)}
                options={PAGE_TYPE_OPTIONS}
                value={page.type}
                onChange={(v) => {
                  page.type = v as QueryPageType;
                  refresh();
                }}
              />

              {isOffset ? (
                <>
                  <DialNumberInput
                    id="qb-page-offset"
                    containerClassName="w-[100px] shrink-0"
                    labelProps={{ label: t(QueryBuilderI18nKey.Offset) }}
                    value={page.offset}
                    onChange={(v) => {
                      page.offset = Number(v || 0);
                      refresh();
                    }}
                  />
                  <DialNumberInput
                    id="qb-page-limit"
                    containerClassName="w-[100px] shrink-0"
                    labelProps={{ label: t(QueryBuilderI18nKey.Limit) }}
                    value={page.limit}
                    onChange={(v) => {
                      page.limit = Number(v || 0);
                      refresh();
                    }}
                  />
                  <div className="flex h-[38px] items-center">
                    <DialCheckbox
                      id="qb-page-total"
                      label={t(QueryBuilderI18nKey.IncludeTotal)}
                      checked={page.includeTotal}
                      onChange={(value) => {
                        page.includeTotal = !!value;
                        refresh();
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <DialInput
                    id="qb-page-cursor"
                    containerClassName="flex-1 min-w-[160px]"
                    labelProps={{ label: t(QueryBuilderI18nKey.Cursor) }}
                    value={page.cursor}
                    placeholder={t(QueryBuilderI18nKey.Cursor)}
                    onChange={(v) => {
                      page.cursor = v ?? '';
                      refresh();
                    }}
                  />
                  <DialNumberInput
                    id="qb-page-cursor-limit"
                    containerClassName="w-[100px] shrink-0"
                    labelProps={{ label: t(QueryBuilderI18nKey.Limit) }}
                    value={page.cursorLimit}
                    onChange={(v) => {
                      page.cursorLimit = Number(v || 0);
                      refresh();
                    }}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PageSection;
