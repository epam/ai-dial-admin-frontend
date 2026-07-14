'use client';

import { FC, ReactNode } from 'react';

import classNames from 'classnames';
import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconLayoutSidebarRightCollapse } from '@tabler/icons-react';

import { QUERY_BUILDER_RAIL_WIDTH_CLASS } from '@/src/constants/analytics/query-builder';
import { MenuI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  onCollapse: () => void;
  switcher?: ReactNode;
  children: ReactNode;
}

const BuilderRail: FC<Props> = ({ onCollapse, switcher, children }) => {
  const t = useI18n();

  return (
    <aside
      aria-label={t(MenuI18nKey.QueryBuilder)}
      className={classNames(
        'flex h-full shrink-0 flex-col border-l border-primary bg-layer-2',
        QUERY_BUILDER_RAIL_WIDTH_CLASS,
      )}
    >
      <div className="flex items-center gap-2 border-b border-primary px-3 py-2">
        <DialGhostIconButton
          size={ElementSize.Small}
          aria-label={t(QueryBuilderI18nKey.CollapsePanel)}
          icon={<IconLayoutSidebarRightCollapse size={18} />}
          onClick={onCollapse}
        />
        {switcher}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </aside>
  );
};

export default BuilderRail;
