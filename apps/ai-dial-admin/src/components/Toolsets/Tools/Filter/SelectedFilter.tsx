'use client';

import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { ToolsetI18nKey } from '@/src/constants/i18n';

const SelectedFilter: FC = () => {
  const t = useI18n();
  return (
    <div className="bg-layer-4 cursor-pointer h-[22px] px-1 small rounded flex items-center justify-center">
      {t(ToolsetI18nKey.View)}: {t(ToolsetI18nKey.AllTools)}
    </div>
  );
};
export default SelectedFilter;
