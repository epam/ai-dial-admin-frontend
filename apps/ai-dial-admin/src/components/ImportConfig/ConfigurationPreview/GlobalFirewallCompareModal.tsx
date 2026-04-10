'use client';
import { FC, useMemo } from 'react';

import { DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import DiffLegend from '@/src/components/ActivityAudit/View/DiffReport/DiffLegend';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import GridView from '@/src/components/Grid/GridView/GridView';
import { DIFF_ROW_CLASS_RULES } from '@/src/constants/ag-grid';
import { DOMAIN_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import {
  ActivityAuditI18nKey,
  CompareI18nKey,
  DeploymentsI18nKey,
  EntitiesI18nKey,
  ImportI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DiffStatus } from '@/src/types/activity-audit';
import { GridOptions } from 'ag-grid-community';

interface Props {
  action: string;
  prevDomains: string[];
  nextDomains: string[];
  isOpen: boolean;
  onClose: () => void;
}

const GlobalFirewallCompareModal: FC<Props> = ({ action, prevDomains, nextDomains, isOpen, onClose }) => {
  const t = useI18n();

  const prevSet = useMemo(() => new Set(prevDomains), [prevDomains]);

  const prevRowData = useMemo(() => prevDomains.map((domain) => ({ domain })), [prevDomains]);

  const nextRowData = useMemo(
    () =>
      nextDomains.map((domain) => ({
        domain,
        diffStatus: prevSet.has(domain) ? undefined : DiffStatus.ADDED,
      })),
    [nextDomains, prevSet],
  );

  const addedCount = useMemo(() => nextDomains.filter((d) => !prevSet.has(d)).length, [nextDomains, prevSet]);

  const gridOptions: GridOptions = {
    domLayout: 'autoHeight',
    rowClassRules: DIFF_ROW_CLASS_RULES,
  };

  return (
    <DialPopup
      onClose={onClose}
      header={t(ImportI18nKey.Changes)}
      portalId="GlobalFirewallCompare"
      open={isOpen}
      size={PopupSize.Lg}
      className="h-[800px]"
      dividers={true}
    >
      <div className="flex flex-col h-full px-6 py-4">
        <div className="flex flex-row gap-x-10">
          <LabelledText
            label={t(EntitiesI18nKey.Action)}
            text={action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()}
          />
          <LabelledText label={t(ActivityAuditI18nKey.ResourceType)} text={t(DeploymentsI18nKey.GlobalFirewall)} />
        </div>

        <div className="flex-1 min-h-0 mt-8 pt-8 border-t border-primary overflow-auto">
          <div className="flex flex-row justify-between items-center mb-4">
            <h3>{t(DeploymentsI18nKey.GlobalWhitelist)}</h3>
            <DiffLegend added={addedCount} />
          </div>
          <div className="flex flex-row gap-8">
            <div className="flex flex-col flex-1">
              <h4 className="mb-2 text-secondary">{t(CompareI18nKey.Before)}</h4>
              <GridView columnDefs={[DOMAIN_COLUMN]} rowData={prevRowData} additionalGridOptions={gridOptions} />
            </div>
            <div className="flex flex-col flex-1">
              <h4 className="mb-2 text-secondary">{t(CompareI18nKey.After)}</h4>
              <GridView columnDefs={[DOMAIN_COLUMN]} rowData={nextRowData} additionalGridOptions={gridOptions} />
            </div>
          </div>
        </div>
      </div>
    </DialPopup>
  );
};

export default GlobalFirewallCompareModal;
