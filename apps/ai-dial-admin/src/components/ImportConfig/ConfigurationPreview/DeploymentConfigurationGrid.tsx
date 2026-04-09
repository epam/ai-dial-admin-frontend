'use client';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ColDef } from 'ag-grid-community';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconReplace } from '@tabler/icons-react';

import DomainList from '@/src/components/Deployments/Common/Whitelists/DomainList';
import { getDeploymentColDefs } from '@/src/components/ExportConfig/deployment-utils';
import {
  getComponentActionColumn,
  GLOBAL_FIREWALL_TAB_ID,
} from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import GlobalFirewallCompareModal from '@/src/components/ImportConfig/ConfigurationPreview/GlobalFirewallCompareModal';
import GridView from '@/src/components/Grid/GridView/GridView';
import { CompareI18nKey, DeploymentsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FileComponentItem } from '@/src/models/import';
import { ActivityAuditEntity } from '@/src/types/activity-audit';

interface Props {
  selectedTab: string;
  tabData: Record<string, BaseEntity[]>;
  currentState: Record<string, ActivityAuditEntity[]>;
  prevState: Record<string, ActivityAuditEntity[]>;
  globalFirewall?: FileComponentItem | null;
}

const DeploymentConfigurationGrid: FC<Props> = ({ selectedTab, tabData, globalFirewall }) => {
  const t = useI18n();

  const [rowData, setRowData] = useState<BaseEntity[]>([]);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [isFirewallModalOpen, setIsFirewallModalOpen] = useState(false);

  const isGlobalFirewallTab = selectedTab === GLOBAL_FIREWALL_TAB_ID;

  useEffect(() => {
    if (selectedTab && !isGlobalFirewallTab) {
      const baseColumns = getDeploymentColDefs(t, undefined, selectedTab);
      setColDefs([getComponentActionColumn(), ...baseColumns]);
      setRowData(tabData[selectedTab] || []);
    } else {
      setColDefs([]);
      setRowData([]);
    }
  }, [selectedTab, t, tabData, isGlobalFirewallTab]);

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
            <DomainList domains={firewallNext || []} />
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

  return <GridView columnDefs={colDefs} rowData={rowData} emptyDataProps={{ title: t(EntitiesI18nKey.NoEntities) }} />;
};

export default DeploymentConfigurationGrid;
