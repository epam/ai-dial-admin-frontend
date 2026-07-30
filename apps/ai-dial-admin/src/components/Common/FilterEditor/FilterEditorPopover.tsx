'use client';

import {
  autoUpdate,
  FloatingFocusManager,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { cloneElement, FC, ReactElement, ReactNode, useCallback, useState } from 'react';

interface Props {
  isComplete: boolean;
  onCommit: () => void;
  onCancel: () => void;
  children: ReactElement;
  editor: (onClose: () => void) => ReactNode;
}

const FilterEditorPopover: FC<Props> = ({ isComplete, onCommit, onCancel, children, editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [shift()],
    whileElementsMounted: autoUpdate,
  });

  const onClose = useCallback(() => {
    setIsOpen(false);
    onCancel();
  }, [onCancel]);

  const click = useClick(context);
  const role = useRole(context, { role: 'tooltip' });
  const dismiss = useDismiss(context, {
    outsidePress: () => {
      if (isComplete) {
        onCommit();
      }
      onClose();
      return true;
    },
  });

  const { getFloatingProps, getReferenceProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {cloneElement(children)}
      </div>
      {isOpen ? (
        <div aria-expanded={isOpen}>
          <FloatingFocusManager context={context}>
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 50 }} {...getFloatingProps()}>
              {editor(onClose)}
            </div>
          </FloatingFocusManager>
        </div>
      ) : null}
    </>
  );
};

export default FilterEditorPopover;
