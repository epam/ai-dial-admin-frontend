import { FC } from 'react';
import { IconCurrencyDollar } from '@tabler/icons-react';

import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  elementId: string;
  fieldTitle?: string;
  placeholder?: string;
  value?: string | null;
  onChange?: (value: string | number) => void;
}

const PriceControl: FC<Props> = ({ elementId, fieldTitle, ...props }) => {
  return (
    <NumberInputField
      elementId={elementId}
      fieldTitle={fieldTitle}
      containerCssClass="w-[120px] lg:w-auto lg:max-w-[120px]"
      iconBeforeInput={<IconCurrencyDollar className="text-secondary" {...BASE_ICON_PROPS} />}
      {...props}
    />
  );
};
// disabled={activeType === BasicI18nKey.None}
export default PriceControl;
