'use client';

import classNames from 'classnames';
import { useState, ReactNode, FC } from 'react';
import {
  useFloating,
  autoPlacement,
  shift,
  FloatingFocusManager,
  useRole,
  useInteractions,
  useDismiss,
  useClick,
  autoUpdate,
  offset,
} from '@floating-ui/react';

export interface ContextMenuItem {
  title: string;
  onClick?: () => void;
  icon: ReactNode;
}

interface Props {
  children?: ReactNode;
  contextMenuItems: ContextMenuItem[];
}

const ContextMenu: FC<Props> = ({ children, contextMenuItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [
      shift(),
      autoPlacement({ allowedPlacements: ['bottom-start', 'top-start'] }),
      offset({
        mainAxis: -40,
        alignmentAxis: 40,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const role = useRole(context, { role: 'menu' });
  const dismiss = useDismiss(context);

  const { getFloatingProps, getReferenceProps } = useInteractions([click, dismiss, role]);

  const buttonClassName = classNames('flex flex-row items-center py-2 px-3 focus-visible:outline outline-offset-0');

  return (
    <>
      <button ref={refs.setReference} {...getReferenceProps()} className="flex" aria-label="context-menu">
        {children}
      </button>
      {isOpen && (
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
            }}
            {...getFloatingProps()}
            className="flex flex-col bg-layer-0 rounded "
          >
            <ul className="flex flex-col">
              {contextMenuItems?.map((item, index) => {
                const onClick = () => {
                  if (item?.onClick) {
                    item.onClick();
                  }
                  setIsOpen(false);
                };
                return (
                  <li key={index}>
                    <button type="button" className={buttonClassName} onClick={onClick}>
                      <i className="text-icon-secondary">{item.icon}</i>
                      <span className="small ml-3">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
};

export default ContextMenu;
