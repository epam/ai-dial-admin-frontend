'use client';

import { DialGhostIconButton, DialTabs, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTableAccess } from '@/src/app/[lang]/tables/actions';
import ConnectAuthBlock from '@/src/components/Analytics/Tables/ConnectPanel/ConnectAuthBlock';
import ConnectReadTab from '@/src/components/Analytics/Tables/ConnectPanel/ConnectReadTab';
import ConnectWriteTab from '@/src/components/Analytics/Tables/ConnectPanel/ConnectWriteTab';
import {
  buildConnectSnippets,
  buildFormatNotes,
  isEnrichmentRead,
  isReadProjectionSubset,
} from '@/src/components/Analytics/Tables/ConnectPanel/connect-snippets';
import {
  ConnectEnrichmentRead,
  ConnectReadOnlyReason,
  ConnectTab,
} from '@/src/components/Analytics/Tables/ConnectPanel/models';
import { useModalFocus } from '@/src/components/Analytics/Tables/ConnectPanel/use-modal-focus';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

interface Props {
  table: AnalyticsTable;
  apiBaseUrl: string;
  flightUri: string;
  onClose: () => void;
}

const READ_ONLY_NOTICE_KEY: Record<ConnectReadOnlyReason, AnalyticsTablesI18nKey> = {
  [ConnectReadOnlyReason.SystemTable]: AnalyticsTablesI18nKey.ConnectSystemReadOnly,
  [ConnectReadOnlyReason.Enrichment]: AnalyticsTablesI18nKey.ConnectEnrichmentReadOnly,
};

// A system table that is also an enrichment reads as a system table: the platform feeding it is the
// broader statement, and it is the one that explains why no access list is worth requesting.
const resolveReadOnlyReason = (table: AnalyticsTable): ConnectReadOnlyReason | null => {
  if (table.system) return ConnectReadOnlyReason.SystemTable;
  if (table.type === AnalyticsTableType.Enrichment) return ConnectReadOnlyReason.Enrichment;
  return null;
};

const ConnectPanel: FC<Props> = ({ table, apiBaseUrl, flightUri, onClose }) => {
  const t = useI18n();
  const panelRef = useRef<HTMLElement | null>(null);
  const readOnlyReason = resolveReadOnlyReason(table);
  const isReadOnly = readOnlyReason !== null;
  const enrichmentRead: ConnectEnrichmentRead | undefined = isEnrichmentRead(table)
    ? { name: table.name, sourceTable: table.source_table }
    : undefined;
  const [activeTab, setActiveTab] = useState<string>(isReadOnly ? ConnectTab.Read : ConnectTab.Write);
  const [writeRoles, setWriteRoles] = useState<string[]>([]);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [isAccessReadable, setIsAccessReadable] = useState(true);

  useModalFocus(panelRef);

  // Loaded on open rather than with the page: most visits never open the panel, and a caller holding
  // no application role gets a 403 here — an expected outcome, so it degrades quietly.
  useEffect(() => {
    if (isReadOnly) return;
    let isCurrent = true;
    const loadAccess = async () => {
      setIsRolesLoading(true);
      try {
        const access = await getTableAccess(table.name);
        if (!isCurrent) return;
        setWriteRoles(access?.write ?? []);
        setIsAccessReadable(Boolean(access));
      } catch {
        if (isCurrent) setIsAccessReadable(false);
      } finally {
        if (isCurrent) setIsRolesLoading(false);
      }
    };
    void loadAccess();
    return () => {
      isCurrent = false;
    };
  }, [table.name, isReadOnly]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const snippets = useMemo(
    () => buildConnectSnippets(table, { baseUrl: apiBaseUrl, flightUri }),
    [table, apiBaseUrl, flightUri],
  );
  const formatNotes = useMemo(() => buildFormatNotes(table), [table]);
  const isProjectionSubset = useMemo(() => isReadProjectionSubset(table), [table]);
  const tabs = useMemo(
    () => [
      { id: ConnectTab.Write, label: t(AnalyticsTablesI18nKey.ConnectTabWrite) },
      { id: ConnectTab.Read, label: t(AnalyticsTablesI18nKey.ConnectTabRead) },
    ],
    [t],
  );

  const onChangeTab = useCallback((tab: string) => setActiveTab(tab), []);

  const title = t(AnalyticsTablesI18nKey.ConnectTitle, { name: table.name });

  return (
    <>
      <div className="absolute left-0 top-0 size-full bg-blackout z-[15]" onClick={onClose} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex flex-col absolute right-0 top-0 bottom-0 w-full md:w-[560px] bg-layer-3 z-20 divide-tertiary divide-y outline-none"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <h3 className="dial-h5 text-primary truncate">{title}</h3>
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconX size={18} />}
            onClick={onClose}
            aria-label={t(ButtonsI18nKey.Close)}
          />
        </div>

        <div className="px-4 pt-3">
          {readOnlyReason ? (
            <p className="dial-tiny-text text-secondary pb-3">{t(READ_ONLY_NOTICE_KEY[readOnlyReason])}</p>
          ) : (
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeTab} />
          )}
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-4">
          <ConnectAuthBlock snippet={snippets.auth} />

          {activeTab === ConnectTab.Write && !isReadOnly ? (
            <ConnectWriteTab
              pythonSnippet={snippets.pythonWrite}
              curlSnippet={snippets.curlWrite}
              restEndpointSnippet={snippets.restEndpoint}
              formatNotes={formatNotes}
              isBaseUrlPlaceholder={!apiBaseUrl?.trim()}
              writeRoles={writeRoles}
              isRolesLoading={isRolesLoading}
              isAccessReadable={isAccessReadable}
            />
          ) : (
            <ConnectReadTab
              pythonSnippet={snippets.pythonRead}
              curlSnippet={snippets.curlRead}
              restEndpointSnippet={snippets.restEndpoint}
              flightInstallSnippet={snippets.flightInstall}
              flightSnippet={snippets.flightRead}
              isBaseUrlPlaceholder={!apiBaseUrl?.trim()}
              isFlightUriPlaceholder={!flightUri?.trim()}
              isProjectionSubset={isProjectionSubset}
              enrichment={enrichmentRead}
            />
          )}
        </div>
      </aside>
    </>
  );
};

export default ConnectPanel;
