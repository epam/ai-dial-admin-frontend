'use client';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconRestore } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import {
  getEntitiesForRevision,
  getRevisions,
  systemRollbackToRevision,
} from '@/src/app/[lang]/activity-audit/actions';
import ActivityAuditEntityDiffLegend from '@/src/components/ActivityAuditView/ActivityAuditViewDiff/ActivityAuditEntityDiffLegend';
import ActivityAuditEntityGrid from '@/src/components/ActivityAuditView/ActivityAuditViewDiff/ActivityAuditEntityGrid';
import { mergeEntityMaps } from '@/src/components/ActivityAuditView/activity-audit.utils';
import Button from '@/src/components/Common/Button/Button';
import Loader from '@/src/components/Common/Loader/Loader';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { ActivityAuditI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity, ActivityAuditResourceType } from '@/src/types/activity-audit';
import { PopUpState } from '@/src/types/pop-up';
import { getRevisionRouteForAllEntities } from '@/src/utils/audit/get-revision-route';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import ConfirmationRollback from './Modals/Confirmation';
import RollbackRevisions from './Modals/Revisions';
import { getSystemRollbackColumns, sorts, SYSTEM_ROLLBACK_ENTITIES, SYSTEM_ROLLBACK_TAB_NAME } from './constants';
import { ActivityAuditRevision } from './models';

const SystemRollback: FC = () => {
  const t = useI18n() as (t: string) => string;

  const tabs = SYSTEM_ROLLBACK_ENTITIES.map((e) => ({
    id: e,
    name: t(MenuI18nKey[`${SYSTEM_ROLLBACK_TAB_NAME[e]}` as keyof typeof MenuI18nKey]),
  }));

  const [selectedTab, setSelectedTab] = useState(tabs[0].id);
  const [columns, setColumns] = useState<ColDef[]>([]);
  const [currentState, setCurrentState] = useState<Map<ActivityAuditResourceType, EntitiesGridData[]>>();
  const [rollbackState, setRollbackState] = useState<Map<ActivityAuditResourceType, EntitiesGridData[]>>();

  const [revisionsModalState, setRevisionsModalState] = useState(PopUpState.Closed);
  const [rollBackModalState, setRollBackModalState] = useState(PopUpState.Closed);
  const [isLoading, setIsLoading] = useState(false);

  const [revisions, setRevisions] = useState<ActivityAuditRevision[] | null>();
  const [currentRevision, setCurrentRevision] = useState<ActivityAuditRevision | null>();
  const [rollbackRevision, setRollbackRevision] = useState<ActivityAuditRevision | null>();

  const systemRollback = useCallback(() => {
    systemRollbackToRevision(rollbackRevision?.id);
    setRollBackModalState(PopUpState.Closed);
  }, [rollbackRevision?.id]);

  const fetchAllEntitiesForRevision = async (
    revision?: ActivityAuditRevision | null,
  ): Promise<Map<ActivityAuditResourceType, ActivityAuditEntity[] | null>> => {
    const resultMap = new Map<ActivityAuditResourceType, ActivityAuditEntity[] | null>();

    await Promise.all(
      SYSTEM_ROLLBACK_ENTITIES.map(async (type) => {
        const url = getRevisionRouteForAllEntities(type);
        if (url) {
          const data = await getEntitiesForRevision(url, revision?.id);
          resultMap.set(type, data);
        } else {
          resultMap.set(type, []);
        }
      }),
    );

    return resultMap;
  };

  const fetchRevisionEntities = useCallback(
    (current?: ActivityAuditRevision | null, rollback?: ActivityAuditRevision) => {
      setIsLoading(true);

      Promise.all([fetchAllEntitiesForRevision(current), fetchAllEntitiesForRevision(rollback)])
        .then(([latestMap, prevLatestMap]) => {
          setCurrentState(mergeEntityMaps(latestMap, prevLatestMap, true));
          setRollbackState(mergeEntityMaps(prevLatestMap, latestMap));
        })
        .finally(() => setIsLoading(false));
    },
    [],
  );

  const updateRevisions = useCallback(
    (revisions: ActivityAuditRevision[], rollbackRevision?: ActivityAuditRevision) => {
      setRollbackRevision(rollbackRevision);
      fetchRevisionEntities(currentRevision, rollbackRevision);
      setRevisions(revisions);
      setRevisionsModalState(PopUpState.Closed);
    },
    [currentRevision, fetchRevisionEntities],
  );

  useEffect(() => {
    if (!revisions) {
      getRevisions(100, 0, sorts, []).then((revisions) => {
        setRevisions(revisions);
        const current = revisions?.at(0);
        const rollback = revisions?.at(1);
        setCurrentRevision(current);
        setRollbackRevision(rollback);
        fetchRevisionEntities(current, rollback);
      });
    }
  }, [fetchRevisionEntities, revisions]);

  useEffect(() => {
    setColumns(getSystemRollbackColumns(selectedTab, t));
  }, [selectedTab, t]);

  return (
    <div className="flex flex-col bg-layer-2 rounded p-4 flex-1 min-h-0">
      <div className="flex flex-row justify-between mb-3">
        <h1>{t(ActivityAuditI18nKey.RollbackSystem)}</h1>
        <div className="flex flex-row gap-3 items-center">
          <div
            className="flex flex-row items-center small bg-layer-3 rounded h-6 p-2 cursor-pointer"
            onClick={() => setRevisionsModalState(PopUpState.Opened)}
          >
            <span>{t(ActivityAuditI18nKey.RollbackRevision)}</span>
            <span>: {formatDateTimeToLocalString(rollbackRevision?.timestamp)}</span>
            <div className="pl-1">
              <OpenPopup />
            </div>
          </div>
          <Button
            iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
            cssClass="primary"
            title={t(ActivityAuditI18nKey.RollbackSystem)}
            onClick={() => setRollBackModalState(PopUpState.Opened)}
          />
        </div>
      </div>
      <div className="flex flex-col min-h-0 flex-1 relative">
        <div className=" pt-6 pb-4">
          <Tabs
            tabs={tabs}
            activeTab={selectedTab}
            onClick={(tab) => setSelectedTab(tab as ActivityAuditResourceType)}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-row w-full mb-4 mt-2 overflow-auto">
          {isLoading ? (
            <Loader size={40} />
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-row gap-8">
                <div className="flex flex-col flex-1">
                  <h3 className="mb-4 text-primary">{t(ActivityAuditI18nKey.CurrentState)}</h3>
                  <ActivityAuditEntityGrid
                    rows={currentState?.get(selectedTab as ActivityAuditResourceType)}
                    columns={columns}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="mb-4 text-primary">{t(ActivityAuditI18nKey.RollbackState)}</h3>
                  <ActivityAuditEntityGrid
                    rows={rollbackState?.get(selectedTab as ActivityAuditResourceType)}
                    columns={columns}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <ActivityAuditEntityDiffLegend description={true} />
      </div>
      {rollBackModalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationRollback
            revisionDate={formatDateTimeToLocalString(rollbackRevision?.timestamp)}
            modalState={rollBackModalState}
            onConfirm={systemRollback}
            onClose={() => setRollBackModalState(PopUpState.Closed)}
          />,
          document.body,
        )}
      {revisionsModalState === PopUpState.Opened &&
        createPortal(
          <RollbackRevisions
            initialRevisions={revisions?.filter((r) => r.id !== currentRevision?.id) || []}
            rollBackRevision={rollbackRevision as ActivityAuditRevision}
            modalState={revisionsModalState}
            onApply={updateRevisions}
            onClose={() => setRevisionsModalState(PopUpState.Closed)}
          />,
          document.body,
        )}
    </div>
  );
};

export default SystemRollback;
