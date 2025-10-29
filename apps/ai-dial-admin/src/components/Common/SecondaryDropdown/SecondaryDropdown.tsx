import { DialSelect, SelectOption } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

interface Props {
  items: SelectOption[];
  selectedValue?: string;
  prefix?: string;
  onChange?: (value: string) => void;
}

const SecondaryDropdown: FC<Props> = ({ items, prefix, selectedValue }) => {
  return (
    <div className="w-fit">
      <DialSelect options={items} value={selectedValue} cssClass="!px-1.5 !py-1 bg-layer-4 h-[25px] min-h-[25px]" />
    </div>
  );
};

export default SecondaryDropdown;
