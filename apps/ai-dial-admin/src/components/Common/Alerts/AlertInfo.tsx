import { IconInfoCircle } from '@tabler/icons-react';
import { FC } from 'react';

import BaseAlert from '@/src/components/Common/Alerts/BaseAlert';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  text: string;
}

const AlertInfo: FC<Props> = ({ text }) => {
  return (
    <BaseAlert
      alertContainerClass="border-accent-primary bg-accent-primary-alpha text-accent-primary"
      text={text}
      icon={<IconInfoCircle {...BASE_ICON_PROPS} widths={24} height={24} />}
    />
  );
};

export default AlertInfo;
