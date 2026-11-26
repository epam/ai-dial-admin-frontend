'use client';

import { FC } from 'react';

import { DIAL_ICON_SIZE } from '@epam/ai-dial-ui-kit';
import { IconLayoutSidebar } from '@tabler/icons-react';

import { QueryBuilderI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onExpand: () => void;
}

const CollapsedSourcePanel: FC<Props> = ({ onExpand }) => {
  const t = useI18n();

  return (
    <button
      type="button"
      aria-label={t(QuerySourcePanelI18nKey.Expand)}
      aria-expanded="false"
      className="-ml-4 flex h-full w-16 shrink-0 flex-col items-center gap-4 border-r border-tertiary py-3 text-secondary hover:bg-layer-raised hover:text-primary focus-visible:bg-layer-raised focus-visible:text-primary focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent md:-ml-6"
      onClick={onExpand}
    >
      <IconLayoutSidebar size={DIAL_ICON_SIZE.MD} className="shrink-0" aria-hidden />
      <span className="rotate-180 text-primary dial-small-semi-text [writing-mode:vertical-rl]">
        {t(QueryBuilderI18nKey.Source)}
      </span>
    </button>
  );
};

export default CollapsedSourcePanel;
