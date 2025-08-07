import { IconAlertTriangle } from '@tabler/icons-react';
import { FC } from 'react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import BaseAlert from '@/src/components/Common/Alerts/BaseAlert';

interface Props {
  text: string;
}

const AlertError: FC<Props> = ({ text }) => {
  return (
    <BaseAlert
      alertContainerClass="border-error bg-error text-error"
      text={text}
      icon={<IconAlertTriangle {...BASE_ICON_PROPS} widths={24} height={25} />}
    />
  );
};

export default AlertError;
