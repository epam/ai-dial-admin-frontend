'use client';

import { DialCheckbox, DialDropdown } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolFilter } from '../type';
import SelectedFilter from './SelectedFilter';

interface Props {
  isAllSelected: boolean;
  selectedFilters: ToolFilter[];
  onSelectAll: () => void;
  onSelectFilter: (value: boolean | undefined, filter: ToolFilter) => void;
}

const ToolsFilter: FC<Props> = ({ isAllSelected, onSelectFilter, selectedFilters, onSelectAll }) => {
  const t = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <DialDropdown
      listClassName="w-[200px]"
      onOpenChange={(open) => setIsDropdownOpen(open)}
      renderOverlay={() => (
        <div className="bg-layer-0 rounded flex flex-col w-[200px]">
          <div className="py-2 px-4">
            <DialCheckbox
              checked={isAllSelected}
              id={ToolFilter.All}
              label={t(ToolsetI18nKey.AllTools)}
              onChange={onSelectAll}
            />
          </div>
          <div className="flex flex-col pl-[20px]">
            <div className="py-2 px-4">
              <DialCheckbox
                checked={selectedFilters.includes(ToolFilter.AutoDetected)}
                id={ToolFilter.AutoDetected}
                label={t(ToolsetI18nKey.AutoDetected)}
                onChange={(value) => onSelectFilter(value, ToolFilter.AutoDetected)}
              />
            </div>
            <div className="py-2 px-4">
              <DialCheckbox
                checked={selectedFilters.includes(ToolFilter.AddedManually)}
                id={ToolFilter.AddedManually}
                label={t(ToolsetI18nKey.AddedManually)}
                onChange={(value) => onSelectFilter(value, ToolFilter.AddedManually)}
              />
            </div>
          </div>
        </div>
      )}
    >
      <SelectedFilter selectedFilters={selectedFilters} isDropdownOpen={isDropdownOpen} />
    </DialDropdown>
  );
};

export default ToolsFilter;
