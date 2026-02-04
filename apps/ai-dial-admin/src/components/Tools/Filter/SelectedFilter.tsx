'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FC, useMemo } from 'react';

import { ToolFilter } from '@/src/components/Tools/type';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isDropdownOpen?: boolean;
  selectedFilters?: ToolFilter[];
}
const SelectedFilter: FC<Props> = ({ selectedFilters, isDropdownOpen }) => {
  const t = useI18n();
  const icon = useMemo(() => {
    return isDropdownOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />;
  }, [isDropdownOpen]);

  const title = useMemo(() => {
    return selectedFilters?.length === 4
      ? t(ToolsetI18nKey.AllTools)
      : selectedFilters?.map((filter) => t(ToolsetI18nKey[filter as keyof typeof ToolsetI18nKey]))?.join(', ');
  }, [selectedFilters, t]);

  return (
    <div className="bg-layer-4 cursor-pointer h-[22px] px-1 small rounded flex items-center justify-center max-w-[150px]">
      {t(ToolsetI18nKey.Filter)}:
      <DialEllipsisTooltip text={title} className="mx-1" />
      {icon}
    </div>
  );
};
export default SelectedFilter;
