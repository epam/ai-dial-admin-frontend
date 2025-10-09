import { FC } from 'react';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  elementId: string;
  fieldTitle?: string;
  placeholder?: string;
  value?: string | null;
  controlClassName?: string;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
}

const PriceControl: FC<Props> = ({ elementId, fieldTitle, controlClassName, ...props }) => {
  return (
    <DialNumberInputField
      elementId={elementId}
      fieldTitle={fieldTitle}
      containerCssClass={controlClassName}
      iconBefore={<IconCurrencyDollar className="text-secondary" {...BASE_ICON_PROPS} />}
      {...props}
    />
  );
};
export default PriceControl;
