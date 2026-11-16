'use client';

import { DIAL_ICON_SIZE, DIAL_KIT_ICON_STROKE, EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useMemo } from 'react';

import { ToolFilter } from '@/src/components/Tools/type';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** Borrows the ui-kit 2.0 field classes (see `TimeFilter`) so the trigger reads as a 2.0 `Select`. */
const TRIGGER_CLASS =
  'dial-kit-input dial-kit-input-small !w-auto max-w-[240px] cursor-pointer items-center gap-x-1 px-2 text-primary';

interface Props {
  isDropdownOpen?: boolean;
  isAllSelected?: boolean;
  selectedFilters?: ToolFilter[];
}

const SelectedFilter: FC<Props> = ({ selectedFilters, isAllSelected, isDropdownOpen }) => {
  const t = useI18n();

  const title = useMemo(() => {
    if (isAllSelected) {
      return t(ToolsetI18nKey.AllTools);
    }

    return selectedFilters?.map((filter) => t(ToolsetI18nKey[filter as keyof typeof ToolsetI18nKey])).join(', ');
  }, [isAllSelected, selectedFilters, t]);

  return (
    <div role="button" tabIndex={0} aria-expanded={!!isDropdownOpen} className={classNames('flex', TRIGGER_CLASS)}>
      <span className="shrink-0">{t(ToolsetI18nKey.Filter)}:</span>
      <EllipsisTooltip text={title} className="min-w-0" />
      <IconChevronDown
        size={DIAL_ICON_SIZE.SM}
        stroke={DIAL_KIT_ICON_STROKE}
        aria-hidden
        className={classNames('shrink-0 text-secondary transition-transform', isDropdownOpen && 'rotate-180')}
      />
    </div>
  );
};

export default SelectedFilter;
