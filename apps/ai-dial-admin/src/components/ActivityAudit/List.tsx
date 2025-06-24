'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconRefresh, IconRestore } from '@tabler/icons-react';
import { GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';

import { getActivities } from '@/src/app/[lang]/activity-audit/actions';
import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { emptyDataTitleMap, getEntityPath, listViewTitleMap } from '@/src/components/EntityListView/entity-list-view';
import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID, CACHE_LIMIT, PAGE_SIZE } from '@/src/constants/ag-grid';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { ActivityAuditI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { TimeRange } from '@/src/models/time-range';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerType } from '@/src/utils/audit/get-rollback-request';
import { formatTimestampToDate } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { SYSTEM_ROLLBACK_ID } from './constants';
import { getActivityAuditColumns, getGridFilters } from './utils';

const ActivityAuditList: FC = () => {
  const t = useI18n();
  const router = useRouter();

  const { showNotification } = useNotification();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [timePeriod, setTimePeriod] = useState<string | null>(DEFAULT_TIME_PERIOD);
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const [currentActivity, setCurrentActivity] = useState<DialActivity | undefined>(void 0);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
    setCurrentActivity(void 0);
  }, [setModalState]);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const actualTimeRange = timePeriod ? getTimeRangeById(timePeriod) : timeRange;
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        const sorts = getRequestSorts(params.sortModel);
        const filters = getGridFilters(params.filterModel, actualTimeRange);

        getActivities(PAGE_SIZE, page, sorts, filters)
          .then((res) => {
            if (res === void 0) {
              router.push(ApplicationRoute.Forbidden);
            } else if (res == null || res.data.length === 0) {
              params.successCallback([], 0);
            } else {
              params.successCallback(res.data || [], page + 1 === res.totalPages ? res.total : void 0);
            }
            gridApi?.setGridOption('loading', false);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, timePeriod, timeRange, router],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const gridOptions: GridOptions = {
    rowModelType: 'infinite',
    cacheBlockSize: PAGE_SIZE,
    blockLoadDebounceMillis: 200,
    maxBlocksInCache: Math.floor(CACHE_LIMIT / PAGE_SIZE),
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(`${ApplicationRoute.ActivityAudit}/${getEntityPath(ApplicationRoute.ActivityAudit, e.data)}`);
      }
    },
  };

  const openInNewTab = useCallback((activity: DialActivity) => {
    window.open(
      `${ApplicationRoute.ActivityAudit}/${getEntityPath(ApplicationRoute.ActivityAudit, activity)}`,
      '_blank',
    );
  }, []);

  const onOpenConfirmationModal = useCallback(
    (activity: DialActivity) => {
      onOpenModal();
      setCurrentActivity(activity);
    },
    [onOpenModal],
  );

  const columnDefs = getActivityAuditColumns(openInNewTab, onOpenConfirmationModal);

  const onRefresh = useCallback(() => {
    if (gridApi) {
      gridApi.setGridOption('loading', true);

      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onTimePeriodChange = useCallback(
    (period: string) => {
      setTimePeriod(period);
      onRefresh();
    },
    [onRefresh],
  );

  const onTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimePeriod(null);
      setTimeRange(range);
      onRefresh();
    },
    [onRefresh],
  );

  const resourceRollback = useCallback(() => {
    if (currentActivity) {
      setIsLoading(true);
      rollbackEntityPerType(currentActivity)
        .then(() => {
          setIsLoading(false);
          showNotification(
            getSuccessNotification(
              t(ActivityAuditI18nKey.ResourceRollback),
              t(ActivityAuditI18nKey.ResourceRollbackDescription),
            ),
          );
          onCloseModal();
          onRefresh();
        })
        .catch(() => {
          setIsLoading(false);
          showNotification(
            getErrorNotification(
              t(ActivityAuditI18nKey.ResourceRollbackErrorTitle),
              t(ActivityAuditI18nKey.ResourceRollbackErrorDescription),
            ),
          );
        });
    }
  }, [onCloseModal, showNotification, currentActivity, t, onRefresh]);

  const systemRollback = useCallback(() => {
    router.push(`${ApplicationRoute.ActivityAudit}/${SYSTEM_ROLLBACK_ID}`);
  }, [router]);

  return (
    <>
      <ListView
        additionalGridOptions={gridOptions}
        columnDefs={columnDefs}
        title={t(listViewTitleMap[ApplicationRoute.ActivityAudit])}
        emptyDataTitle={t(emptyDataTitleMap[ApplicationRoute.ActivityAudit])}
        onGridReady={setGridApi}
        view={ApplicationRoute.ActivityAudit}
      >
        <div className="flex gap-4 justify-end">
          <TimeFilter
            timePeriod={timePeriod as string}
            onTimePeriodChange={onTimePeriodChange}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
          <Button
            cssClass={`secondary`}
            title={t(ButtonsI18nKey.Refresh)}
            iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
            onClick={onRefresh}
          />
          <Button
            iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
            cssClass="secondary"
            title={t(ActivityAuditI18nKey.RollbackSystem)}
            onClick={systemRollback}
          />
        </div>
      </ListView>
      {modalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            isLoading={isLoading}
            heading={t(ActivityAuditI18nKey.ConfirmRollback)}
            onConfirm={resourceRollback}
            modalState={modalState}
            confirmLabel={t(ButtonsI18nKey.Rollback)}
            onClose={onCloseModal}
          >
            <div className="text-secondary small-150 px-6 py-4">
              <p>
                <span>{t(ActivityAuditI18nKey.ConfirmRollbackDescriptionPart1)}</span>
                <span className="important-text-part mx-1">{currentActivity?.activityType}</span>
                <span>{t(ActivityAuditI18nKey.ConfirmRollbackDescriptionPart2)}</span>
                <span className="important-text-part mx-1">{currentActivity?.resourceId}</span>
                <span>{t(ActivityAuditI18nKey.ConfirmRollbackDescriptionPart3)}</span>
                <span className="important-text-part">{formatTimestampToDate(currentActivity?.epochTimestampMs)}</span>
              </p>
              <p>{t(ActivityAuditI18nKey.ConfirmRollbackAsking)}</p>
            </div>
          </ConfirmationModal>,
          document.body,
        )}
    </>
  );
};

export default ActivityAuditList;
