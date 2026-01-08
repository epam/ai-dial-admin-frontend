import { FC } from 'react';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  elementId: string;
  fieldTitle?: string;
  placeholder?: string;
  value?: number | string;
  containerClassName?: string;
  disabled?: boolean;
  onChange?: (value?: number | string) => void;
}
const PriceControl: FC<Props> = ({ elementId, fieldTitle, ...props }) => {
  return (
    <DialNumberInputField
      elementId={elementId}
      fieldTitle={fieldTitle}
      iconBefore={<IconCurrencyDollar className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />}
      {...props}
    />
  );
};
export default PriceControl;
