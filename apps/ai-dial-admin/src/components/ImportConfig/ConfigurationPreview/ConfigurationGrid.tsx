'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ColDef } from 'ag-grid-community';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import Grid from '@/src/components/Grid/Grid';
import {
  getComponentColDefs,
  getEntityByIdentifier,
} from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';
import { PopUpState } from '@/src/types/pop-up';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import { getEntitiesList } from '@/src/utils/entities/get-entities-list';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, BaseEntity[]>;
  currentState: Record<string, ActivityAuditEntity[]>;
  prevState: Record<string, ActivityAuditEntity[]>;
}

const ConfigurationGrid: FC<Props> = ({ selectedTab, tabData, currentState, prevState }) => {
  const t = useI18n() as (v: string) => string;

  const [rowData, setRowData] = useState<BaseEntity[]>([]);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);

  const [detailsModalState, setDetailsModalState] = useState(PopUpState.Closed);
  const [prevEntity, setPrevEntity] = useState<ActivityAuditEntity | undefined>();
  const [nextEntity, setNextEntity] = useState<ActivityAuditEntity | undefined>();
  const [action, setAction] = useState<string | undefined>();

  const emptyDataTitleI18nkKey = useMemo(() => {
    return getEmptyDataTitleI18nKey(selectedTab);
  }, [selectedTab]);

  const partialActivity = useMemo(() => {
    return {
      resourceId: nextEntity?.name || nextEntity?.key || nextEntity?.$id,
      resourceType: getEntitiesList(t).find((e) => e.id === selectedTab)?.name,
      action,
    } as DialActivity;
  }, [action, nextEntity?.$id, nextEntity?.key, nextEntity?.name, selectedTab, t]);

  const onOpenDetailsModal = useCallback(
    (entity?: BaseEntity) => {
      const prev = getEntityByIdentifier(prevState[selectedTab], entity);
      const { action, ...next } = getEntityByIdentifier(currentState[selectedTab], entity);
      setPrevEntity(prev);
      setNextEntity(next);
      setAction(action as string);
      setDetailsModalState(PopUpState.Opened);
    },
    [currentState, prevState, selectedTab],
  );

  const onCloseModal = useCallback(() => {
    setDetailsModalState(PopUpState.Closed);
  }, []);

  useEffect(() => {
    if (selectedTab) {
      setColDefs(getComponentColDefs(selectedTab, t, onOpenDetailsModal));
      setRowData(tabData[selectedTab] || []);
    } else {
      setColDefs([]);
      setRowData([]);
    }
  }, [onOpenDetailsModal, selectedTab, t, tabData]);

  return rowData.length === 0 ? (
    <DialNoDataContent title={t(emptyDataTitleI18nkKey)} />
  ) : (
    <>
      <Grid columnDefs={colDefs} rowData={rowData} />
      {detailsModalState === PopUpState.Opened &&
        createPortal(
          <ActivityDetails
            partialActivity={partialActivity}
            heading={t(ImportI18nKey.Changes)}
            currentState={nextEntity}
            rollBackState={prevEntity}
            modalState={detailsModalState}
            onClose={onCloseModal}
          />,
          document.body,
        )}
    </>
  );
};

export default ConfigurationGrid;
