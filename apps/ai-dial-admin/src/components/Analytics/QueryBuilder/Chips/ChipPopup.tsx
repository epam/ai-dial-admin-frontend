'use client';

import { FC, ReactNode } from 'react';

import { Dropdown, DropdownOverlayRole } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

interface Props {
  titleId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  panel: ReactNode;
  widthClassName?: string;
  children: ReactNode;
}

const ChipPopup: FC<Props> = ({ titleId, isOpen, onOpenChange, panel, widthClassName = 'w-[400px]', children }) => (
  <Dropdown
    open={isOpen}
    onOpenChange={onOpenChange}
    placement="bottom-start"
    matchReferenceWidth={false}
    overlayRole={DropdownOverlayRole.Dialog}
    overlayAriaLabelledBy={titleId}
    listClassName={classNames('!flex max-w-[90vw] !flex-col [&&]:!overflow-hidden', widthClassName)}
    renderOverlay={() => panel}
  >
    {children}
  </Dropdown>
);

export default ChipPopup;
