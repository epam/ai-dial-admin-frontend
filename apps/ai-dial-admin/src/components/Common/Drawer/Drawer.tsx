'use client';

import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import CloseButton from '@/src/components/Common/CloseButton/CloseButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

// The Escape that dismisses an open popup inside the drawer (a select's list) must not also close the drawer.
const isEscapeForInnerPopup = (event?: Event): boolean =>
  event instanceof KeyboardEvent &&
  event.target instanceof Element &&
  !!event.target.closest('[aria-expanded="true"], [role="listbox"], [role="menu"]');

// A modal panel on the right edge. A click outside does not close it: the body holds form input that an
// accidental click should not discard.
const Drawer: FC<Props> = ({ isOpen, onClose, ariaLabel, header, children, footer, className }) => {
  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (open, event) => {
      if (!open && !isEscapeForInnerPopup(event)) onClose();
    },
  });
  const dismiss = useDismiss(context, { outsidePress: false });
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (!isOpen) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingOverlay lockScroll className="z-[var(--z-overlay,52)] bg-blackout">
        <FloatingFocusManager context={context} outsideElementsInert>
          <aside
            ref={refs.setFloating}
            {...getFloatingProps({ 'aria-label': ariaLabel })}
            className={classNames(
              'fixed inset-y-0 right-0 flex w-[460px] max-w-full flex-col bg-layer-3 shadow-lg',
              className,
            )}
          >
            <header className="flex shrink-0 items-center justify-between gap-2 px-6 pb-2 pt-6">
              <div className="min-w-0 flex-1">{header}</div>
              <CloseButton className="shrink-0" onClose={onClose} />
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">{children}</div>
            {footer && <footer className="shrink-0 px-6 pb-6 pt-2">{footer}</footer>}
          </aside>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
};

export default Drawer;
