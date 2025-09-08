'use client';

import { FC, useMemo } from 'react';

import { useI18n } from '@/src/locales/client';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { ToolFilter } from '@/src/components/Toolsets/Tools/type';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  selectedFilters?: ToolFilter[];
}
const SelectedFilter: FC<Props> = ({ selectedFilters }) => {
  const t = useI18n();
  const title = useMemo(() => {
    return selectedFilters?.length === 4
      ? t(ToolsetI18nKey.AllTools)
      : selectedFilters?.map((filter) => t(ToolsetI18nKey[filter as keyof typeof ToolsetI18nKey]))?.join(', ');
  }, [selectedFilters, t]);

  return (
    <div className="bg-layer-4 cursor-pointer h-[22px] px-1 small rounded flex items-center justify-center max-w-[150px]">
      {t(ToolsetI18nKey.View)}:
      <Tooltip triggerClassName="ml-1" tooltip={title}>
        {title}
      </Tooltip>
    </div>
  );
};
export default SelectedFilter;
