import { DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { FC, useMemo, useState } from 'react';

interface Props {
  items: DropdownItem[];
  selectedValue?: string;
  prefix?: string;
  onChange?: (value: string) => void;
}

const SecondaryDropdown: FC<Props> = ({ items, prefix, selectedValue, onChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const icon = useMemo(() => {
    return isDropdownOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />;
  }, [isDropdownOpen]);

  return (
    <div className="w-fit">
      <DialDropdown
        menu={{ items: items.map((item) => ({ ...item, onClick: () => onChange?.(item.key) })) }}
        onOpenChange={(open) => setIsDropdownOpen(open)}
      >
        <div className="flex items-center my-[5px] mr-2 px-1.5 py-1 small text-primary rounded bg-layer-4 cursor-pointer">
          {prefix && <span className="mr-1">{prefix}</span>}
          {items.find((item) => item.key === selectedValue)?.label}

          <span className="ml-2">{icon}</span>
        </div>
      </DialDropdown>
    </div>
  );
};

export default SecondaryDropdown;
