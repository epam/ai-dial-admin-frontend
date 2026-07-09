import { FC } from 'react';

import { DialGhostButton, DialInput, DialNumberInput, DialRemoveButton, DialSelectField } from '@epam/ai-dial-ui-kit';

import { BUCKET_UNIT_OPTIONS } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { bucketFieldOptions } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createBucket } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { QueryBucketUnit } from '@/src/models/analytics/query';

const TimeBuckets: FC = () => {
  const t = useI18n();
  const { state, refresh } = useQueryBuilder();
  const fieldOptions = bucketFieldOptions(state.fields);

  const addBucket = () => {
    state.buckets.push(createBucket(fieldOptions[0]?.name || ''));
    refresh();
  };

  return (
    <div className={STANDARD_CONTROL_WIDTH}>
      <div className="flex flex-col gap-2">
        {state.buckets.map((bucket, index) => (
          <div key={bucket.id} className="flex items-end gap-2">
            <DialNumberInput
              id={`qb-bucket-amount-${bucket.id}`}
              containerClassName="w-[88px] shrink-0"
              labelProps={index === 0 ? { label: t(QueryBuilderI18nKey.Every) } : undefined}
              value={bucket.amount}
              onChange={(v) => {
                bucket.amount = Number(v || 0);
                refresh();
              }}
            />
            <DialSelectField
              id={`qb-bucket-unit-${bucket.id}`}
              containerClassName="w-[112px] shrink-0"
              label={index === 0 ? t(QueryBuilderI18nKey.Unit) : undefined}
              options={BUCKET_UNIT_OPTIONS}
              value={bucket.unit}
              onChange={(v) => {
                bucket.unit = v as QueryBucketUnit;
                refresh();
              }}
            />
            <DialSelectField
              id={`qb-bucket-field-${bucket.id}`}
              containerClassName="flex-1 min-w-[160px]"
              label={index === 0 ? t(QueryBuilderI18nKey.Field) : undefined}
              options={fieldOptions.map((f) => ({ value: f.name, label: f.name }))}
              value={bucket.field}
              placeholder={t(QueryBuilderI18nKey.TimestampFieldPlaceholder)}
              onChange={(v) => {
                bucket.field = v as string;
                refresh();
              }}
            />
            <DialInput
              id={`qb-bucket-alias-${bucket.id}`}
              containerClassName="w-[160px] shrink-0"
              labelProps={index === 0 ? { label: t(QueryBuilderI18nKey.Alias) } : undefined}
              value={bucket.alias}
              placeholder={t(QueryBuilderI18nKey.AliasPlaceholder)}
              onChange={(v) => {
                bucket.alias = v ?? '';
                refresh();
              }}
            />
            <DialRemoveButton
              onClick={() => {
                state.buckets = state.buckets.filter((b) => b !== bucket);
                refresh();
              }}
            />
          </div>
        ))}
        <div>
          <DialGhostButton label={t(QueryBuilderI18nKey.AddTimeBucket)} onClick={addBucket} />
        </div>
      </div>
    </div>
  );
};

export default TimeBuckets;
