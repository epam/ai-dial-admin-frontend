'use client';

import { FC } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialTag } from '@epam/ai-dial-ui-kit';

interface Props {
  title: string;
  type: string;
  values: string[];
  totalCount: number;
}

// The hover panel behind an attribute row: the dataset's own first rows for that column, which is
// what tells two same-typed columns apart, plus the count of rows the preview stops short of.
const AttributeSamplesPreview: FC<Props> = ({ title, type, values, totalCount }) => {
  const t = useI18n();
  const remainingCount = Math.max(totalCount - values.length, 0);

  return (
    <div className="flex flex-col min-w-[200px]">
      <div className="flex items-center gap-2 truncate py-2">
        <span className="text-primary text-sm font-semibold truncate">{title}</span>
        <DialTag label={type} />
      </div>
      <div className="flex flex-col gap-1 text-left">
        <div className="flex flex-col gap-1">
          {values.map((value, index) => (
            <div key={index} className="grid grid-cols-[20px_1fr] truncate text-sm text-primary">
              <span className="text-secondary">{index + 1}</span> {value}
            </div>
          ))}
        </div>
        {remainingCount > 0 && (
          <p className="text-sm text-secondary">{t(TestSuitesI18nKey.MoreDatasetRows, { count: remainingCount })}</p>
        )}
      </div>
    </div>
  );
};

export default AttributeSamplesPreview;
