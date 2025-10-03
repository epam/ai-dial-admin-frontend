'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconRefresh, IconRestore } from '@tabler/icons-react';
import { GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import classNames from 'classnames';
import { DialButton, ButtonVariant } from '@epam/ai-dial-ui-kit';

import { getActivities } from '@/src/app/[lang]/activity-audit/actions';
import { getActivityAuditColumns, getGridFilters } from '@/src/components/ActivityAudit/List/utils';
import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/EntityListView/constants';
import ResetFiltersButton from '@/src/components/EntityListView/HeaderButtons/ResetFiltersButton';
import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID, CACHE_LIMIT, PAGE_SIZE } from '@/src/constants/ag-grid';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { ActivityAuditI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto } from '@/src/models/request';
import { TimeRange } from '@/src/models/time-range';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerType } from '@/src/utils/audit/get-rollback-request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { DialApplicationScheme } from '@/src/models/dial/application';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  entity?: BaseEntity | DialApplicationScheme;
  entityType?: string;
}

const ActivityAuditList: FC<Props> = ({ entity, entityType }) => {
  const t = useI18n() as (key: string) => string;
  const router = useRouter();

  const { showNotification } = useNotification();

  const [rollbackModalState, setRollbackModalState] = useState(PopUpState.Closed);
  const [detailsModalState, setDetailsModalState] = useState(PopUpState.Closed);

  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [timePeriod, setTimePeriod] = useState<string | null>(DEFAULT_TIME_PERIOD);
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const [selectedActivity, setSelectedActivity] = useState<DialActivity | undefined>(void 0);

  const onCloseModal = useCallback(() => {
    setRollbackModalState(PopUpState.Closed);
    setDetailsModalState(PopUpState.Closed);
    setSelectedActivity(void 0);
  }, [setRollbackModalState]);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const actualTimeRange = timePeriod ? getTimeRangeById(timePeriod) : timeRange;
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        const sorts = getRequestSorts(params.sortModel);
        const filters = [
          ...(entity
            ? [
                {
                  column: 'resourceId',
                  value: (entity as DialApplicationScheme).$id || (entity as BaseEntity).name,
                  operator: 'eq',
                } as FilterDto,
                {
                  column: 'resourceType',
                  value: entityType,
                  operator: 'eq',
                } as FilterDto,
              ]
            : []),
          ...getGridFilters(params.filterModel, actualTimeRange),
        ];

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
    [timePeriod, timeRange, gridApi, entity, entityType, router],
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
    onCellClicked: !entity
      ? (e) => {
          if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
            router.push(`${ApplicationRoute.ActivityAudit}/${getEntityPath(ApplicationRoute.ActivityAudit, e.data)}`);
          }
        }
      : void 0,
  };

  const openInNewTab = useCallback((activity?: DialActivity) => {
    window.open(
      `${ApplicationRoute.ActivityAudit}/${getEntityPath(ApplicationRoute.ActivityAudit, activity)}`,
      '_blank',
    );
  }, []);

  const onOpenConfirmationModal = useCallback((activity?: DialActivity) => {
    setRollbackModalState(PopUpState.Opened);
    setSelectedActivity(activity);
  }, []);

  const onOpenDetailsModal = useCallback((activity?: DialActivity) => {
    setDetailsModalState(PopUpState.Opened);
    setSelectedActivity(activity);
  }, []);

  const columnDefs = entity
    ? getActivityAuditColumns(t, void 0, onOpenConfirmationModal, onOpenDetailsModal, true)
    : getActivityAuditColumns(t, openInNewTab, onOpenConfirmationModal, void 0);

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
    if (selectedActivity) {
      setIsLoading(true);
      rollbackEntityPerType(selectedActivity)
        .then((res) => {
          setIsLoading(false);
          onCloseModal();
          if (res?.success) {
            showNotification(
              getSuccessNotification(
                t(ActivityAuditI18nKey.ResourceRollback),
                t(ActivityAuditI18nKey.ResourceRollbackDescription),
              ),
            );
            onRefresh();
          } else {
            showNotification(
              getErrorNotification(
                res?.errorHeader || t(ActivityAuditI18nKey.ResourceRollbackErrorTitle),
                res?.errorMessage,
              ),
            );
          }
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
  }, [selectedActivity, showNotification, t, onCloseModal, onRefresh]);

  const systemRollback = useCallback(() => {
    router.push(`${ApplicationRoute.ActivityAudit}/${SYSTEM_ROLLBACK_ID}`);
  }, [router]);

  return (
    <div role="activities" className="flex flex-col flex-1 min-h-0 w-full relative">
      <ListView
        additionalGridOptions={gridOptions}
        columnDefs={columnDefs}
        title={!entity ? t(listViewTitleMap[ApplicationRoute.ActivityAudit]) : void 0}
        emptyDataTitle={t(emptyDataTitleMap[ApplicationRoute.ActivityAudit])}
        onGridReady={setGridApi}
        view={!entity ? ApplicationRoute.ActivityAudit : void 0}
      >
        <div className={classNames('flex gap-4', entity ? 'flex-1 justify-between' : 'justify-end')}>
          <ResetFiltersButton gridApi={gridApi} />
          <TimeFilter
            timePeriod={timePeriod as string}
            onTimePeriodChange={onTimePeriodChange}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
          />
          <DialButton
            variant={ButtonVariant.Secondary}
            title={t(ButtonsI18nKey.Refresh)}
            iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
            onClick={onRefresh}
          />
          {!entity && (
            <DialButton
              iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
              variant={ButtonVariant.Secondary}
              title={t(ActivityAuditI18nKey.RollbackSystem)}
              onClick={systemRollback}
            />
          )}
        </div>
      </ListView>
      {rollbackModalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            isLoading={isLoading}
            heading={t(ActivityAuditI18nKey.ConfirmRollback)}
            onConfirm={resourceRollback}
            modalState={rollbackModalState}
            confirmLabel={t(ButtonsI18nKey.Rollback)}
            onClose={onCloseModal}
          >
            <div className="text-secondary small-150 px-6 py-4">
              <p>
                <span>{t(ActivityAuditI18nKey.ConfirmRollbackDescriptionPart1)}</span>
                <span className="important-text-part mx-1">{selectedActivity?.activityType}</span>
                <span>{t(ActivityAuditI18nKey.ConfirmRollbackDescriptionPart2)}</span>
                <Tooltip tooltip={selectedActivity?.resourceId || ''} triggerClassName="flex-1">
                  <span className="important-text-part mx-1">{selectedActivity?.resourceId}</span>
                </Tooltip>
                <span>{t(ActivityAuditI18nKey.ConfirmRollbackDescriptionPart3)}</span>
                <span className="important-text-part">
                  {formatDateTimeToLocalString(selectedActivity?.epochTimestampMs)}
                </span>
              </p>
              <p>{t(ActivityAuditI18nKey.ConfirmRollbackAsking)}</p>
            </div>
          </ConfirmationModal>,
          document.body,
        )}
      {detailsModalState === PopUpState.Opened &&
        createPortal(
          <ActivityDetails
            entity={entity}
            auditViewId={selectedActivity?.activityId}
            modalState={detailsModalState}
            onClose={onCloseModal}
          />,
          document.body,
        )}
    </div>
  );
};

export default ActivityAuditList;
