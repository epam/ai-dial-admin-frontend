'use client';
import { FC, PropsWithChildren, ReactNode, useCallback, useState } from 'react';

import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconMaximize } from '@tabler/icons-react';
import classNames from 'classnames';

import FullscreenViewer from '@/src/components/Common/FullscreenViewer/FullscreenViewer';
import { ViewerContentType } from '@/src/types/evaluation';

interface Props {
  title: string;
  growOnOpen?: boolean;
  defaultOpen?: boolean;
  headerIcon?: ReactNode;
  fullViewContent?: string;
}

const CollapsibleSection: FC<PropsWithChildren<Props>> = ({
  title,
  growOnOpen = false,
  defaultOpen = true,
  headerIcon,
  fullViewContent,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <div className={classNames('min-h-0 flex flex-col', isOpen && growOnOpen && 'flex-1')}>
      <div className="w-full mb-4 flex items-center gap-x-2">
        <p
          className="flex-1 min-w-0 flex items-center gap-x-2 cursor-pointer select-none dial-small-text font-semibold"
          onClick={toggle}
        >
          <IconChevronDown className={classNames('transition-transform shrink-0', !isOpen && '-rotate-90')} size={16} />
          {title}
        </p>
        {headerIcon}
        {fullViewContent && (
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconMaximize size={16} />}
            onClick={() => setIsFullscreen(true)}
          />
        )}
      </div>
      {isOpen && (
        <div className={classNames('min-h-0 overflow-y-auto flex flex-col', growOnOpen && 'flex-1')}>{children}</div>
      )}
      <FullscreenViewer
        isOpen={isFullscreen}
        title={title}
        content={fullViewContent || ''}
        contentType={ViewerContentType.Json}
        onClose={() => setIsFullscreen(false)}
      />
    </div>
  );
};

export default CollapsibleSection;
