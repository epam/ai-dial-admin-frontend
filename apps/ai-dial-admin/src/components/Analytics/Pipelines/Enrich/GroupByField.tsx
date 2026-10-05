'use client';

import { FC } from 'react';

import { Input } from '@epam/ai-dial-ui-kit';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  value?: string;
  grainKey?: string;
  onChange: (groupBy: string) => void;
}

/**
 * A group trigger's grouping key, as free text defaulting to the target's grain key.
 *
 * The service is particular about it — the bare key only where the read source declares it, and
 * `<enrichment>.<grain key>` where the source reaches it through one — but predicting which spelling it
 * will take left the author with a field they could not correct when the prediction was wrong. So the
 * console offers the likely value and stays out of the way; the service decides, and says so in its own
 * words when it refuses.
 */
const GroupByField: FC<Props> = ({ value, grainKey, onChange }) => {
  const t = useI18n();

  return (
    <Input
      id="pipeline-trigger-group-by"
      containerClassName={getControlClassName()}
      labelProps={{ label: t(AnalyticsPipelinesI18nKey.GroupBy), required: true }}
      value={value ?? grainKey ?? ''}
      onChange={(next) => onChange(next ?? '')}
    />
  );
};

export default GroupByField;
