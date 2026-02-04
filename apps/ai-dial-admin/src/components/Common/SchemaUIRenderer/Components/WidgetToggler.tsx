import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import classNames from 'classnames';

interface Props {
  children: ReactNode;
  title?: string;
  isRoot?: boolean;
}
export const WidgetToggler: FC<Props> = ({ children, title, isRoot }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (containerRef.current) {
        const hasErrorClass = containerRef.current.querySelector('.dial-input-error') !== null;
        setHasError(hasErrorClass);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-full relative">
      {!isRoot && (
        <button className="absolute right-0 top-0 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <IconChevronUp size="24" stroke={2} /> : <IconChevronDown size="24" stroke={2} />}
        </button>
      )}
      <div className="flex flex-col w-full">
        <div
          className={classNames(
            'w-full h-10 pl-[18px] flex items-center bg-layer-2',
            isOpen || isRoot ? 'max-h-0 overflow-hidden' : 'max-h-unset',
          )}
        >
          {title}
          {hasError && <span className="inline-block bg-red-400 rounded-full w-[10px] h-[10px] ml-2"></span>}
        </div>
        <div
          ref={containerRef}
          className={classNames('w-full', !isOpen && !isRoot ? 'max-h-0 overflow-hidden' : 'max-h-unset')}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
