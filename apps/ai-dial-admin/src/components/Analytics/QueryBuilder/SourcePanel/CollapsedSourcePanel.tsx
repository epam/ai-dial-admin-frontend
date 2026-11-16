'use client';

import { FC } from 'react';

import { IconLayoutSidebarLeftExpand } from '@tabler/icons-react';

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
      className="flex h-full w-9 shrink-0 flex-col items-center gap-2 border-r border-tertiary bg-layer-2 py-3 text-secondary hover:bg-layer-3 hover:text-primary focus-visible:bg-layer-3 focus-visible:text-primary"
      onClick={onExpand}
    >
      <IconLayoutSidebarLeftExpand size={18} className="shrink-0" aria-hidden />
      <span className="uppercase tracking-wide dial-tiny-semi-text [writing-mode:vertical-rl]">
        {t(QueryBuilderI18nKey.Source)}
      </span>
    </button>
  );
};

export default CollapsedSourcePanel;
