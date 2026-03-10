import { DialNumberInput } from '@epam/ai-dial-ui-kit';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { FC } from 'react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  elementId: string;
  label?: string;
  placeholder?: string;
  value?: number | string;
  containerClassName?: string;
  disabled?: boolean;
  onChange?: (value?: number | string) => void;
}
const PriceControl: FC<Props> = ({ elementId, label, ...props }) => {
  return (
    <DialNumberInput
      id={elementId}
      labelProps={{ label }}
      iconBefore={<IconCurrencyDollar className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />}
      {...props}
    />
  );
};
export default PriceControl;
