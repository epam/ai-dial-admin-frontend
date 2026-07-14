'use client';

import { FC } from 'react';

import { IconLayoutSidebarRightExpand } from '@tabler/icons-react';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onExpand: () => void;
}

// The rail's collapsed state: a slim vertical strip at the right edge with a rotated label,
// separated from the results by the same border the expanded rail uses. Clicking anywhere expands.
const CollapsedRail: FC<Props> = ({ onExpand }) => {
  const t = useI18n();

  return (
    <button
      type="button"
      aria-label={t(QueryBuilderI18nKey.OpenPanel)}
      aria-expanded="false"
      className="flex h-full w-9 shrink-0 flex-col items-center gap-2 border-l border-primary bg-layer-2 py-3 text-secondary hover:bg-layer-3 hover:text-primary"
      onClick={onExpand}
    >
      <IconLayoutSidebarRightExpand size={18} className="shrink-0" />
      <span className="uppercase tracking-wide dial-tiny-semi-text [writing-mode:vertical-rl]">
        {t(QueryBuilderI18nKey.OpenPanel)}
      </span>
    </button>
  );
};

export default CollapsedRail;
