import { FC } from 'react';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import ChipRow from '@/src/components/Analytics/QueryBuilder/Common/ChipRow';
import CompactInput from '@/src/components/Analytics/QueryBuilder/Common/CompactInput';
import CompactSelect from '@/src/components/Analytics/QueryBuilder/Common/CompactSelect';
import SectionAction from '@/src/components/Analytics/QueryBuilder/Common/SectionAction';
import SectionBlock from '@/src/components/Analytics/QueryBuilder/Common/SectionBlock';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { bucketFieldOptions, fieldsToOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { createBucket } from '@/src/components/Analytics/QueryBuilder/utils/state';
import {
  BUCKET_SECTION_WARNINGS,
  BUCKET_UNIT_OPTIONS,
  DATE_BIN_FN,
  WARNING_I18N,
} from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryBucketUnit } from '@/src/models/analytics/query';
import { BucketRow, QueryBuilderColor } from '@/src/models/analytics/query-builder';
import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';

const summaryOf = (bucket: BucketRow): string =>
  `${DATE_BIN_FN}(${bucket.amount} ${bucket.unit}, ${bucket.field || '…'})${bucket.alias ? ` AS ${bucket.alias}` : ''}`;

const TimeBuckets: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();

  const fieldOptions = fieldsToOptions(bucketFieldOptions(state.fields));
  const warnings = getAggregateWarnings(state).filter((w) => BUCKET_SECTION_WARNINGS.includes(w));
  const warning = warnings.length ? warnings.map((w) => t(WARNING_I18N[w])).join(' ') : undefined;

  const addBucket = () => {
    state.buckets.push(createBucket(bucketFieldOptions(state.fields)[0]?.name || ''));
    refresh();
  };

  return (
    <SectionBlock
      title={t(QueryBuilderI18nKey.TimeBucket)}
      markerClassName={QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension].marker}
      warning={warning}
      action={<SectionAction label={t(QueryBuilderI18nKey.AddField)} onClick={addBucket} />}
    >
      <div className="flex flex-col gap-1.5">
        {state.buckets.map((bucket) => (
          <ChipRow
            key={bucket.id}
            inline
            summary={summaryOf(bucket)}
            onRemove={() => {
              state.buckets = state.buckets.filter((b) => b !== bucket);
              refresh();
            }}
          >
            <CompactInput
              ariaLabel={t(QueryBuilderI18nKey.Every)}
              className="w-[44px] shrink-0"
              numeric
              value={String(bucket.amount)}
              onChange={(value) => {
                bucket.amount = Number(value || 0);
                refresh();
              }}
            />
            <div className="w-[92px] shrink-0">
              <CompactSelect
                ariaLabel={t(QueryBuilderI18nKey.Unit)}
                options={BUCKET_UNIT_OPTIONS}
                value={bucket.unit}
                onChange={(v) => {
                  bucket.unit = v as QueryBucketUnit;
                  refresh();
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <CategorizedFieldDropdown
                id={`qb-bucket-field-${bucket.id}`}
                options={fieldOptions}
                value={bucket.field}
                placeholder={t(QueryBuilderI18nKey.TimestampFieldPlaceholder)}
                ariaLabel={t(QueryBuilderI18nKey.Field)}
                onSelect={(name) => {
                  bucket.field = name;
                  refresh();
                }}
              />
            </div>
            <CompactInput
              ariaLabel={t(QueryBuilderI18nKey.AliasPlaceholder)}
              className="w-[72px] shrink-0"
              value={bucket.alias}
              placeholder={t(QueryBuilderI18nKey.AliasPlaceholder)}
              onChange={(value) => {
                bucket.alias = value;
                refresh();
              }}
            />
          </ChipRow>
        ))}
        {!state.buckets.length && (
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.NoFields)}</span>
        )}
      </div>
    </SectionBlock>
  );
};

export default TimeBuckets;
