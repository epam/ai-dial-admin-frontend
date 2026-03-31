import { IconCopy } from '@tabler/icons-react';
import { useCallback, useEffect, useRef } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

export interface ContextMenuPosition {
  x: number;
  y: number;
  value: string;
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

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[140px] rounded bg-layer-1 py-1"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-controls-accent-alpha hover:text-accent-primary"
        onClick={handleCopy}
        role="menuitem"
      >
        <IconCopy {...BASE_BUTTON_ICON_PROPS} />
        {t(ButtonsI18nKey.Copy)}
      </button>
    </div>
  );
};

export default CellContextMenu;
