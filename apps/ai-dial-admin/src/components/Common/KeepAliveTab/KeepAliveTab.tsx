import { FC, ReactNode, useState } from 'react';
import classNames from 'classnames';

interface Props {
  isActive: boolean;
  children: ReactNode;
}

/**
 * Mounts its children on first activation and keeps them mounted afterwards, hidden while inactive.
 * For tabs whose unsaved edits live in local component state and would be lost on unmount.
 */
const KeepAliveTab: FC<Props> = ({ isActive, children }) => {
  const [hasBeenActive, setHasBeenActive] = useState(isActive);

  if (isActive && !hasBeenActive) {
    setHasBeenActive(true);
  }

  if (!isActive && !hasBeenActive) return null;

  return (
    <div className={classNames('h-full min-h-0', { hidden: !isActive })} inert={!isActive}>
      {children}
    </div>
  );
};

export default KeepAliveTab;
