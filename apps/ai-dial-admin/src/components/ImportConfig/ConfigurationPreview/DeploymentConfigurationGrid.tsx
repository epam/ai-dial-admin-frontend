'use client';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconReplace } from '@tabler/icons-react';

import { GridOptions, RowClassParams } from 'ag-grid-community';

import DomainList from '@/src/components/Deployments/Common/Whitelists/DomainList';
import { getDeploymentColDefs } from '@/src/components/ExportConfig/deployment-utils';
import { getComponentActionColumn } from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import { GLOBAL_FIREWALL_TAB_ID } from '@/src/constants/deployments/import';
import GlobalFirewallCompareModal from '@/src/components/ImportConfig/ConfigurationPreview/GlobalFirewallCompareModal';
import GridView from '@/src/components/Grid/GridView/GridView';
import { IMPORT_VALIDATION_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { CompareI18nKey, DeploymentsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { ROW_IMPORT_META_KEY } from '@/src/constants/import';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { RowImportMeta } from '@/src/models/deployments/import';
import { FileComponentItem } from '@/src/models/import';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { ValidationState } from '@/src/types/deployments/import';

interface Props {
  selectedTab: string;
  tabData: Record<string, BaseEntity[]>;
  currentState: Record<string, ActivityAuditEntity[]>;
  prevState: Record<string, ActivityAuditEntity[]>;
  globalFirewall?: FileComponentItem | null;
  firewallErrorsByDomain?: Record<string, string[]>;
}

const DeploymentConfigurationGrid: FC<Props> = ({ selectedTab, tabData, globalFirewall, firewallErrorsByDomain }) => {
  const t = useI18n();

  const [isFirewallModalOpen, setIsFirewallModalOpen] = useState(false);

  const isGlobalFirewallTab = selectedTab === GLOBAL_FIREWALL_TAB_ID;
  const showGrid = selectedTab && !isGlobalFirewallTab;

  const colDefs = showGrid
    ? [getComponentActionColumn(), ...getDeploymentColDefs(t, undefined, selectedTab), IMPORT_VALIDATION_COLUMN(t)]
    : [];
  const rowData = showGrid ? tabData[selectedTab] || [] : [];

  const gridOptions: GridOptions = {
    getRowClass: (params: RowClassParams) => {
      const meta = params.data?.[ROW_IMPORT_META_KEY] as RowImportMeta | undefined;
      return meta?.validationState === ValidationState.FAILED ? 'ag-error-row' : undefined;
    },
  };

  const firewallNext = globalFirewall?.next as string[] | null;
  const firewallPrev = globalFirewall?.prev as string[] | null;
  const firewallAction = globalFirewall?.importAction;

  const onOpenCompare = useCallback(() => setIsFirewallModalOpen(true), []);
  const onCloseCompare = useCallback(() => setIsFirewallModalOpen(false), []);

  if (isGlobalFirewallTab && globalFirewall) {
    return (
      <>
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
              <h3>{t(DeploymentsI18nKey.GlobalWhitelist)}</h3>
              <DialGhostButton
                label={t(CompareI18nKey.CompareChanges)}
                iconBefore={<IconReplace {...BASE_BUTTON_ICON_PROPS} />}
                onClick={onOpenCompare}
              />
            </div>
            <DomainList domains={firewallNext || []} errors={firewallErrorsByDomain} />
          </div>
        </div>

        {isFirewallModalOpen &&
          createPortal(
            <GlobalFirewallCompareModal
              action={firewallAction || ''}
              prevDomains={firewallPrev || []}
              nextDomains={firewallNext || []}
              isOpen={isFirewallModalOpen}
              onClose={onCloseCompare}
            />,
            document.body,
          )}
      </>
    );
  }

  return (
    <GridView
      key={selectedTab}
      columnDefs={colDefs}
      rowData={rowData}
      additionalGridOptions={gridOptions}
      emptyDataProps={{ title: t(EntitiesI18nKey.NoEntities) }}
    />
  );
};

export default DeploymentConfigurationGrid;
