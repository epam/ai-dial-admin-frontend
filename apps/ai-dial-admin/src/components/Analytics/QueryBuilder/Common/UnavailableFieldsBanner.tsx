'use client';

import { FC } from 'react';

import { IconAlertTriangle } from '@tabler/icons-react';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  fields: string[];
  source: string;
}

// One wording, one icon, one repair — whether the column was dropped from the catalog or is not
// visible to this caller. Distinguishing the two would disclose which columns exist, which is the
// invariant the service's sensitive-column rules exist to hold.
const UnavailableFieldsBanner: FC<Props> = ({ fields, source }) => {
  const t = useI18n();

  if (!fields.length) return null;

  const message =
    fields.length === 1
      ? t(QueryBuilderI18nKey.UnavailableFieldSingle, { field: fields[0], source })
      : t(QueryBuilderI18nKey.UnavailableFieldMultiple, {
          count: fields.length,
          source,
          fields: fields.join(', '),
        });

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded border border-warning bg-warning px-3 py-2 dial-tiny-text text-primary"
    >
      <IconAlertTriangle size={16} className="mt-px shrink-0 text-warning" />
      <span>{message}</span>
    </div>
  );
};

export default UnavailableFieldsBanner;
