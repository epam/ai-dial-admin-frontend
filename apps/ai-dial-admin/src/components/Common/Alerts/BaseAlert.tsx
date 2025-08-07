import classNames from 'classnames';
import { FC, ReactNode } from 'react';

interface Props {
  text: string;
  icon: ReactNode;
  alertContainerClass: string;
}

const BaseAlert: FC<Props> = ({ text, icon, alertContainerClass }) => {
  const alertClasses = classNames('p-3 flex flex-row items-center', 'border rounded', alertContainerClass);

  return (
    <div className={alertClasses}>
      {icon}
      <span className="text-primary small-150 ml-3 flex-1">{text}</span>
    </div>
  );
};

export default BaseAlert;
