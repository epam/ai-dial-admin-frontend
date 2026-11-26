'use client';

import { FC, ReactNode, useEffect, useId, useRef } from 'react';

import { ElementSize, GhostIconButton } from '@epam/ai-dial-ui-kit';
import { IconLayoutSidebarRight, IconLayoutSidebarRightCollapse, IconSparkles } from '@tabler/icons-react';
import classNames from 'classnames';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOpen: boolean;
  isOverlay: boolean;
  onToggle: (isOpen: boolean) => void;
  children: ReactNode;
}

const AiSidePanel: FC<Props> = ({ isOpen, isOverlay, onToggle, children }) => {
  const t = useI18n();
  const panelId = useId();
  const headingId = useId();
  const expandRef = useRef<HTMLButtonElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const isFocusMoved = useRef(false);

  useEffect(() => {
    if (!isFocusMoved.current) return;
    isFocusMoved.current = false;
    const target = isOpen ? controlsRef.current?.querySelector('button') : expandRef.current;
    target?.focus();
  }, [isOpen]);

  const onToggleWithFocus = (next: boolean) => {
    isFocusMoved.current = true;
    onToggle(next);
  };

  if (!isOpen) {
    return (
      <button
        ref={expandRef}
        type="button"
        aria-label={t(QueryBuilderI18nKey.AiPanelExpand)}
        aria-expanded="false"
        className="flex w-12 shrink-0 flex-col items-center gap-4 border-l border-tertiary py-3 text-secondary hover:bg-layer-raised hover:text-primary focus-visible:bg-layer-raised focus-visible:text-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
        onClick={() => onToggleWithFocus(true)}
      >
        <IconLayoutSidebarRight size={18} className="shrink-0" aria-hidden />
        <IconSparkles size={18} className="shrink-0 text-accent" aria-hidden />
        <span className="text-primary dial-small-semi-text [writing-mode:vertical-rl]">
          {t(QueryBuilderI18nKey.AskAi)}
        </span>
      </button>
    );
  }

  return (
    <aside
      id={panelId}
      aria-labelledby={headingId}
      className={classNames(
        'flex w-[400px] max-w-full shrink-0 flex-col border-l border-tertiary',
        isOverlay && 'absolute inset-y-0 right-0 z-10 bg-layer-base shadow-lg',
      )}
    >
      <div ref={controlsRef} className="flex shrink-0 items-center gap-2 border-b border-tertiary px-4 py-3">
        <IconSparkles size={18} className="shrink-0 text-accent" aria-hidden />
        <h2 id={headingId} className="dial-small-semi-text text-primary">
          {t(QueryBuilderI18nKey.AskAi)}
        </h2>
        <GhostIconButton
          className="ml-auto"
          size={ElementSize.Small}
          aria-label={t(QueryBuilderI18nKey.AiPanelCollapse)}
          aria-expanded="true"
          aria-controls={panelId}
          icon={<IconLayoutSidebarRightCollapse size={18} aria-hidden />}
          onClick={() => onToggleWithFocus(false)}
        />
      </div>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </aside>
  );
};

export default AiSidePanel;
