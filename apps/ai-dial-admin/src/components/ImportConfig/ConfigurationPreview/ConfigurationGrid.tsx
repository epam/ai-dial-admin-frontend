'use client';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ColDef } from 'ag-grid-community';

import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import { importPreviewResource } from '@/src/components/ActivityAudit/View/Header/constants';
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
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import { getEntitiesList } from '@/src/utils/entities/get-entities-list';
import GridView from '@/src/components/Grid/GridView/GridView';

interface Props {
  selectedTab: EntityType;
  tabData: Record<string, BaseEntity[]>;
  currentState: Record<string, ActivityAuditEntity[]>;
  prevState: Record<string, ActivityAuditEntity[]>;
}

const ConfigurationGrid: FC<Props> = ({ selectedTab, tabData, currentState, prevState }) => {
  const t = useI18n();

  const [rowData, setRowData] = useState<BaseEntity[]>([]);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prevEntity, setPrevEntity] = useState<ActivityAuditEntity | undefined>();
  const [nextEntity, setNextEntity] = useState<ActivityAuditEntity | undefined>();
  const [action, setAction] = useState<string | undefined>();

  const selectedTabRef = useRef(selectedTab);

  useEffect(() => {
    selectedTabRef.current = selectedTab;
  }, [selectedTab]);

  const emptyDataTitleI18nkKey = useMemo(() => {
    return getEmptyDataTitleI18nKey(selectedTab);
  }, [selectedTab]);

  const partialActivity = useMemo(() => {
    const type = getEntitiesList(t).find((e) => e.id === selectedTab)?.id as EntityType;
    return {
      resourceId: nextEntity?.name || nextEntity?.key || nextEntity?.$id,
      resourceType: importPreviewResource[type],
      action,
    } as DialActivity;
  }, [action, nextEntity?.$id, nextEntity?.key, nextEntity?.name, selectedTab, t]);

  const onOpenDetailsModal = useCallback(
    (entity?: BaseEntity) => {
      const prev = getEntityByIdentifier(prevState[selectedTabRef.current], entity);
      const { action, ...next } = getEntityByIdentifier(currentState[selectedTabRef.current], entity);
      setPrevEntity(prev);
      setNextEntity(next);
      setAction(action as string);
      setIsModalOpen(true);
    },
    [currentState, prevState],
  );

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
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

  return (
    <>
      <GridView columnDefs={colDefs} rowData={rowData} emptyDataProps={{ title: t(emptyDataTitleI18nkKey) }} />
      {isModalOpen &&
        createPortal(
          <ActivityDetails
            partialActivity={partialActivity}
            heading={t(ImportI18nKey.Changes)}
            currentState={nextEntity}
            rollBackState={prevEntity}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
          />,
          document.body,
        )}
    </>
  );
};

export default ConfigurationGrid;
