'use client';

import { FC, useEffect, useId, useState } from 'react';

import { DIAL_ICON_SIZE, GhostIconButton, Tabs } from '@epam/ai-dial-ui-kit';
import { IconLayoutSidebar } from '@tabler/icons-react';
import classNames from 'classnames';

import CollapsedSourcePanel from '@/src/components/Analytics/QueryBuilder/SourcePanel/CollapsedSourcePanel';
import QueriesTab from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueriesTab';
import TablesTab from '@/src/components/Analytics/QueryBuilder/SourcePanel/TablesTab';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { QueryBuilderI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';

interface Props {
  defaultTab: SourcePanelTab;
  currentTable?: string;
  currentQueryId?: string;
}

const SourcePanel: FC<Props> = ({ defaultTab, currentTable, currentQueryId }) => {
  const t = useI18n();
  const { selectedTab, onSelectTab, isCollapsed, onToggleCollapsed } = useSourcePanel();
  const isNarrow = useIsTabletScreen();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const contentId = useId();

  const activeTab = selectedTab ?? defaultTab;
  const isExpanded = isNarrow ? isOverlayOpen : !isCollapsed;

  useEffect(() => {
    if (selectedTab == null) onSelectTab(defaultTab);
  }, [selectedTab, defaultTab, onSelectTab]);

  useEffect(() => {
    setIsOverlayOpen(false);
  }, [currentTable, currentQueryId]);

  const onToggleExpanded = (next: boolean) => {
    if (isNarrow) setIsOverlayOpen(next);
    else onToggleCollapsed(!next);
  };

  const tabs = [
    { id: SourcePanelTab.Tables, label: t(QuerySourcePanelI18nKey.Tables) },
    { id: SourcePanelTab.Queries, label: t(QuerySourcePanelI18nKey.Queries) },
  ];

  if (!isExpanded) {
    return <CollapsedSourcePanel onExpand={() => onToggleExpanded(true)} />;
  }

  return (
    <>
      {isNarrow && <div className="-ml-4 w-16 shrink-0 md:-ml-6" />}
      <aside
        aria-label={t(QueryBuilderI18nKey.Source)}
        className={classNames(
          'flex h-full w-[336px] shrink-0 flex-col gap-4 border-r border-tertiary pr-6',
          isNarrow && 'absolute inset-y-0 left-0 z-10 max-w-full bg-layer-1 shadow',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Tabs
            ariaLabel={t(QuerySourcePanelI18nKey.Tabs)}
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={(id) => onSelectTab(id as SourcePanelTab)}
          />
          <GhostIconButton
            aria-label={t(QuerySourcePanelI18nKey.Collapse)}
            aria-expanded
            aria-controls={contentId}
            icon={<IconLayoutSidebar size={DIAL_ICON_SIZE.MD} aria-hidden />}
            onClick={() => onToggleExpanded(false)}
          />
        </div>
        <div id={contentId} className="flex min-h-0 flex-1 flex-col gap-3">
          {activeTab === SourcePanelTab.Tables ? (
            <TablesTab currentTable={currentTable} />
          ) : (
            <QueriesTab currentQueryId={currentQueryId} />
          )}
        </div>
      </aside>
    </>
  );
};

export default SourcePanel;
