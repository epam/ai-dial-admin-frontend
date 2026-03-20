'use client';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialLoader, DialPrimaryButton, DialSwitch, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconRestore } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';

import OpenPopup from '@/public/images/icons/open-pop-up.svg';
import {
  getEntitiesForRevision,
  getRevisions,
  systemRollbackToRevision,
} from '@/src/app/[lang]/activity-audit/actions';
import { sorts } from '@/src/components/ActivityAudit/constants';
import AuditEntityGrid from '@/src/components/ActivityAudit/EntityGrid/EntityGrid';
import ConfirmationRollback from '@/src/components/ActivityAudit/Modals/Confirmation';
import RollbackRevisions from '@/src/components/ActivityAudit/Modals/Revisions';
import { ActivityAuditRevision } from '@/src/components/ActivityAudit/models';
import { SYSTEM_ROLLBACK_ENTITIES, SYSTEM_ROLLBACK_TAB_NAME } from '@/src/components/ActivityAudit/Rollback/constants';
import { getSystemRollbackColumns } from '@/src/components/ActivityAudit/Rollback/utils';
import DiffLegend from '@/src/components/ActivityAudit/View/DiffReport/DiffLegend';
import FilterControl from '@/src/components/ActivityAudit/View/DiffReport/FilterControl';
import { mergeEntityMaps } from '@/src/components/ActivityAudit/View/utils/generate-diffs';
import JsonView from '@/src/components/Common/JsonView/JsonView';
import { ActivityAuditI18nKey, MenuI18nKey, RollbackI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { ActivityAuditDiff, DialActivity } from '@/src/models/activity-audit';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ActivityAuditEntity, ActivityAuditResourceType, DiffView } from '@/src/types/activity-audit';
import { getRevisionRouteForAllEntities } from '@/src/utils/audit/get-revision-route';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';

const SystemRollback: FC = () => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const tabs = SYSTEM_ROLLBACK_ENTITIES.map((e) => ({
    id: e,
    label: t(MenuI18nKey[`${SYSTEM_ROLLBACK_TAB_NAME[e]}` as keyof typeof MenuI18nKey]),
  }));
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification, removeNotification } = useNotification();

  const [selectedTab, setSelectedTab] = useState(tabs[0].id);
  const [columns, setColumns] = useState<ColDef[]>([]);

  const [currentState, setCurrentState] = useState<Map<ActivityAuditResourceType, EntitiesGridData[]>>();
  const [rollbackState, setRollbackState] = useState<Map<ActivityAuditResourceType, EntitiesGridData[]>>();

  const [currentRows, setCurrentRows] = useState<ActivityAuditDiff[]>();
  const [rollbackRows, setRollbackRows] = useState<ActivityAuditDiff[]>();

  const [isRevisionsModalOpen, setRevisionModalOpen] = useState(false);
  const [isRollBackModalOpen, setIsRollBackModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [revisions, setRevisions] = useState<ActivityAuditRevision[] | null>();
  const [currentRevision, setCurrentRevision] = useState<ActivityAuditRevision | null>();
  const [rollbackRevision, setRollbackRevision] = useState<ActivityAuditRevision | null>();

  const [diffView, setDiffView] = useState(DiffView.ALL);
  const [activity, setActivity] = useState<DialActivity | undefined>(void 0);

  const [isJsonView, setIsJsonView] = useState(false);

  const systemRollback = useCallback(() => {
    const prepareNotificationId = showNotification(
      getPrepareNotification(
        t(RollbackI18nKey.NotificationPrepareTitle, { entity: t(RollbackI18nKey.System) }),
        t(RollbackI18nKey.NotificationPrepareDescription, { entity: t(RollbackI18nKey.System) }),
      ),
    );
    systemRollbackToRevision(rollbackRevision?.id).then((res) => {
      if (res.success) {
        removeNotification(prepareNotificationId);
        showNotification(
          getSuccessNotification(
            t(RollbackI18nKey.NotificationSuccessTitle, { entity: t(RollbackI18nKey.System) }),
            t(RollbackI18nKey.NotificationSuccessDescription),
          ),
        );
      } else {
        removeNotification(prepareNotificationId);
        showNotification(
          getErrorNotification(
            t(RollbackI18nKey.NotificationErrorTitle, { entity: t(RollbackI18nKey.System) }),
            t(RollbackI18nKey.NotificationErrorDescription),
            res?.requestId,
          ),
        );
      }
    });
    setIsRollBackModalOpen(false);
  }, [removeNotification, rollbackRevision?.id, showNotification, t]);

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
      setRevisionModalOpen(false);
    },
    [currentRevision, fetchRevisionEntities],
  );

  useEffect(() => {
    if (!revisions) {
      getReqRef.current(getRevisions, 100, 0, sorts, []).then((res) => {
        if (res.success) {
          const revisions = res.response;
          setRevisions(revisions);
          const current = revisions?.at(0);
          const rollback = revisions?.at(1);
          setCurrentRevision(current);
          setRollbackRevision(rollback);
          fetchRevisionEntities(current, rollback);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setColumns(getSystemRollbackColumns(selectedTab, t));
    setActivity({ resourceType: selectedTab } as DialActivity);
  }, [selectedTab, t]);

  useEffect(() => {
    setCurrentRows(
      (diffView === DiffView.ALL
        ? currentState?.get(selectedTab as ActivityAuditResourceType)
        : currentState
            ?.get(selectedTab as ActivityAuditResourceType)
            ?.filter((data) => data.diffStatus)) as ActivityAuditDiff[],
    );
    setRollbackRows(
      (diffView === DiffView.ALL
        ? rollbackState?.get(selectedTab as ActivityAuditResourceType)
        : rollbackState
            ?.get(selectedTab as ActivityAuditResourceType)
            ?.filter((data) => data.diffStatus)) as ActivityAuditDiff[],
    );
  }, [currentState, diffView, rollbackState, selectedTab]);

  return (
    <div className="flex flex-col bg-layer-2 rounded py-4 px-6 flex-1 min-h-0">
      <div className="flex flex-row justify-between mb-4 items-center h-[38x]">
        <h1>{t(RollbackI18nKey.Rollback)}</h1>
        <div className="flex flex-row gap-3 items-center">
          <FilterControl diffView={diffView} setDiffView={setDiffView} isResources={true} />
          <div
            className={
              isReadOnlyAdmin
                ? 'flex flex-row items-center small bg-layer-3 rounded h-6 p-2'
                : 'flex flex-row items-center small bg-layer-3 rounded h-6 p-2 cursor-pointer'
            }
            onClick={isReadOnlyAdmin ? undefined : () => setRevisionModalOpen(true)}
            role={isReadOnlyAdmin ? undefined : 'button'}
          >
            <span>{t(RollbackI18nKey.Revision)}</span>
            <span>: {formatDateTimeToLocalString(rollbackRevision?.timestamp)}</span>
            {!isReadOnlyAdmin && (
              <div className="pl-1">
                <OpenPopup />
              </div>
            )}
          </div>
          {!isReadOnlyAdmin && (
            <DialPrimaryButton
              iconBefore={<IconRestore {...BASE_BUTTON_ICON_PROPS} />}
              label={t(RollbackI18nKey.Rollback)}
              onClick={() => setIsRollBackModalOpen(true)}
              disabled={isLoading}
            />
          )}
          <div className="w-px h-6 bg-layer-4"></div>
          <DialSwitch switchId="jsonView" isOn={isJsonView} onChange={() => setIsJsonView(!isJsonView)} label="JSON" />
        </div>
      </div>
      <div className="flex flex-col min-h-0 flex-1 relative">
        <div className="pt-6 pb-4">
          <DialTabs
            tabs={tabs}
            activeTab={selectedTab}
            onClick={(tab) => setSelectedTab(tab as ActivityAuditResourceType)}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-row w-full mb-4 mt-2 overflow-auto">
          {isLoading ? (
            <DialLoader size={40} />
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {isJsonView ? (
                <JsonView
                  modified={JSON.stringify(rollbackRows || {}, null, 2)}
                  original={JSON.stringify(currentRows || {}, null, 2)}
                />
              ) : (
                <div className="flex-1 flex flex-row gap-8">
                  <div className="flex flex-col flex-1">
                    <h3 className="mb-4 text-primary">{t(ActivityAuditI18nKey.CurrentState)}</h3>
                    <AuditEntityGrid
                      data={currentRows}
                      columns={columns}
                      diffView={diffView}
                      rollbackRows={rollbackRows}
                      activity={activity}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="mb-4 text-primary">{t(RollbackI18nKey.State)}</h3>
                    <AuditEntityGrid
                      data={rollbackRows}
                      columns={columns}
                      diffView={diffView}
                      currentRows={currentRows}
                      activity={activity}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DiffLegend description={true} />
      </div>
      {!isReadOnlyAdmin &&
        isRollBackModalOpen &&
        createPortal(
          <ConfirmationRollback
            revisionDate={formatDateTimeToLocalString(rollbackRevision?.timestamp)}
            isModalOpen={isRollBackModalOpen}
            onConfirm={systemRollback}
            onClose={() => setIsRollBackModalOpen(false)}
          />,
          document.body,
        )}
      {!isReadOnlyAdmin && isRevisionsModalOpen &&
        createPortal(
          <RollbackRevisions
            initialRevisions={revisions?.filter((r) => r.id !== currentRevision?.id) || []}
            rollBackRevision={rollbackRevision as ActivityAuditRevision}
            isModalOpen={isRevisionsModalOpen}
            onApply={updateRevisions}
            onClose={() => setRevisionModalOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
};

export default SystemRollback;
