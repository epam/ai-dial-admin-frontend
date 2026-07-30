'use client';

import { IconCheck, IconX } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

const IncludeInRunCellRenderer: FC<ICellRendererParams> = ({ value }) => {
  const t = useI18n();
  const included = value === true;

  return (
    <div className="flex items-center gap-2">
      {included ? (
        <IconCheck {...BASE_BUTTON_ICON_PROPS} className="text-accent-secondary" />
      ) : (
        <IconX {...BASE_BUTTON_ICON_PROPS} className="text-error" />
      )}
      <span className="truncate">
        {included ? t(TestSuitesI18nKey.IncludedInRun) : t(TestSuitesI18nKey.ExcludedFromRun)}
      </span>
    </div>
  );
};

export default IncludeInRunCellRenderer;
