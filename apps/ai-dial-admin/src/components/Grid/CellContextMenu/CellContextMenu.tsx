import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import { useCallback, useEffect, useRef } from 'react';

import { ActionMenuOperationI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import { CONTEXT_MENU_ESTIMATED_HEIGHT, CONTEXT_MENU_ESTIMATED_WIDTH } from '../constants';

export interface ContextMenuPosition {
  x: number;
  y: number;
  value: string;
  href?: string;
}

interface CellContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
}

const CellContextMenu = ({ position, onClose }: CellContextMenuProps) => {
  const t = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    if (position?.value != null) {
      await navigator.clipboard.writeText(String(position.value));
    }
    onClose();
  }, [position, onClose]);

  const handleOpenInNewTab = useCallback(() => {
    if (position?.href) {
      window.open(position.href, '_blank');
    }
    onClose();
  }, [position, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position) return null;

  const openLeft = position.x > window.innerWidth - CONTEXT_MENU_ESTIMATED_WIDTH;
  const openTop = position.y > window.innerHeight - CONTEXT_MENU_ESTIMATED_HEIGHT;
  const horizontalStyle = openLeft ? { right: window.innerWidth - position.x } : { left: position.x };
  const verticalStyle = openTop ? { bottom: window.innerHeight - position.y } : { top: position.y };
  const positionStyle = { ...horizontalStyle, ...verticalStyle };

  return (
    <div ref={menuRef} className="fixed z-50 min-w-[140px] rounded bg-layer-1 py-1" style={positionStyle} role="menu">
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-controls-accent-alpha hover:text-accent-primary"
        onClick={handleCopy}
        role="menuitem"
      >
        <IconCopy {...BASE_BUTTON_ICON_PROPS} />
        {t(ButtonsI18nKey.Copy)}
      </button>
      {position.href && (
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-controls-accent-alpha hover:text-accent-primary"
          onClick={handleOpenInNewTab}
          role="menuitem"
        >
          <IconExternalLink {...BASE_BUTTON_ICON_PROPS} />
          {t(ActionMenuOperationI18nKey.Open_in_new_tab)}
        </button>
      )}
    </div>
  );
};

export default CellContextMenu;
