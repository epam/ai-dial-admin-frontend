import { FC } from 'react';
import classNames from 'classnames';
import { IconAlertTriangle } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  text: string;
}

const AlertError: FC<Props> = ({ text }) => {
  const alertClasses = classNames('p-3 flex flex-row items-center', 'border border-error bg-error text-error rounded');

  return (
    <div className={alertClasses}>
      <IconAlertTriangle {...BASE_ICON_PROPS} widths={24} height={25} />
      <span className="text-primary small-150 ml-3 flex-1">{text}</span>
    </div>
  );
};

export default AlertError;
