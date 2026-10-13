'use client';

import { FC, MouseEvent, ReactNode, useCallback } from 'react';

import Drawer from '@/src/components/Common/Drawer/Drawer';
import { BACKFILL_DRAWER_CLASS } from '@/src/constants/analytics/backfill';

// The shared drawer paints its scrim with this class and leaves nothing semantic on it to find it by. The ui-kit
// popup paints its own overlay with the same class, so the scrim is told apart by holding the panel directly.
const SCRIM_CLASS = 'bg-blackout';

const isDrawerScrim = (target: EventTarget): boolean =>
  target instanceof Element && target.classList.contains(SCRIM_CLASS) && target.querySelector(':scope > aside') != null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * The drawer both backfills open in: the panel the table permissions use, a little wider, modal, and not mounted
 * while closed so each opening reads the service afresh.
 *
 * A press on the scrim closes it. The shared drawer ignores outside presses on purpose, because its permissions form
 * holds input a stray click would discard; a backfill form is two dates. That is decided here by catching the press
 * as it bubbles out of the portal. Only the scrim itself counts, since a calendar popup or a confirmation opened
 * from inside is also outside the panel, and its own overlay carries the scrim's class; and it is a press, not a click, so dragging a selection out does not close it.
 */
const BackfillDrawer: FC<Props> = ({ isOpen, onClose, title, children }) => {
  const onMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (isDrawerScrim(event.target)) onClose();
    },
    [onClose],
  );

  return (
    // Presentational: the keyboard's way out is the drawer's own Escape and close control.
    <div role="presentation" className="contents" onMouseDown={onMouseDown}>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        ariaLabel={title}
        header={<h2 className="text-primary">{title}</h2>}
        className={BACKFILL_DRAWER_CLASS}
      >
        {children}
      </Drawer>
    </div>
  );
};

export default BackfillDrawer;
