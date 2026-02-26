'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialNeutralButton, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconRefresh, IconRestore } from '@tabler/icons-react';
import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import classNames from 'classnames';

import { getActivities } from '@/src/app/[lang]/activity-audit/actions';
import {
  getActivityAuditColumns,
  getAuditActivityHref,
  getGridFilters,
} from '@/src/components/ActivityAudit/List/utils';
import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';
import { ButtonsI18nKey, RollbackI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto } from '@/src/models/request';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerType } from '@/src/utils/audit/get-rollback-request';
import {
  getRollbackErrorDescription,
  getRollbackErrorTitle,
  getRollbackSuccessDescription,
  getRollbackSuccessTitle,
} from '@/src/utils/entities/rollback-entity';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ACTIVITY_AUDIT_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  entity?: BaseEntity | DialApplicationScheme;
  entityType?: string;
  refresh?: boolean;
  initTimeFilter?: string | TimeRange;
  onChangeTimeFilter?: (filter: string | TimeRange) => void;
  isCustomRange?: boolean;
  setIsCustomRange?: Dispatch<SetStateAction<boolean>>;
}

const ActivityAuditList: FC<Props> = ({
  entity,
  entityType,
  refresh,
  initTimeFilter,
  onChangeTimeFilter,
  isCustomRange,
  setIsCustomRange,
}) => {
  const t = useI18n();
  const router = useRouter();

  const { showNotification } = useNotification();

  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [timePeriod, setTimePeriod] = useState<string | undefined>();
  const [timeRange, setTimeRange] = useState<TimeRange>(getTimeRangeById(DEFAULT_TIME_PERIOD));

  const [selectedActivity, setSelectedActivity] = useState<DialActivity | undefined>(void 0);

  useEffect(() => {
    if (!timePeriod) {
      if (!isCustomRange) {
        setTimePeriod((initTimeFilter as string) || DEFAULT_TIME_PERIOD);
        setTimeRange(getTimeRangeById((initTimeFilter as string) || DEFAULT_TIME_PERIOD));
      } else {
        setTimePeriod(DEFAULT_TIME_PERIOD);
        setTimeRange((initTimeFilter as TimeRange) || getTimeRangeById(DEFAULT_TIME_PERIOD));
      }
    }
  }, [initTimeFilter, timePeriod, isCustomRange]);

  const onCloseModal = useCallback(() => {
    setIsRollbackModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedActivity(void 0);
  }, [setIsRollbackModalOpen]);

  const openInNewTab = useCallback((activity?: DialActivity) => {
    onOpenInNewTab(ApplicationRoute.ActivityAudit, activity);
  }, []);

  const onOpenConfirmationModal = useCallback((activity?: DialActivity) => {
    setIsRollbackModalOpen(true);
    setSelectedActivity(activity);
  }, []);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const actualTimeRange = timeRange;
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
            if (res == null || res.data.length === 0) {
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
    [timeRange, gridApi, entity, entityType],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        if (entity) {
          const href = getAuditActivityHref(entity, entityType as ActivityAuditResourceType, e.data.activityId);
          if (href) {
            router.push(href);
          }
        } else {
          router.push(getUrnForEntity(ApplicationRoute.ActivityAudit, e.data));
        }
      }
    },
  };

  const columnDefs = entity
    ? [...ACTIVITY_AUDIT_COLUMNS(t, true)]
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
      onChangeTimeFilter?.(period);
      setTimeRange(getTimeRangeById(period));
      onRefresh();
    },
    [onRefresh, onChangeTimeFilter],
  );

  const onTimeRangeChange = useCallback(
    (range: TimeRange, isCustom?: boolean) => {
      setTimeRange(range);
      if (isCustom) {
        onChangeTimeFilter?.(range);
      }
      onRefresh();
    },
    [onRefresh, onChangeTimeFilter],
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
                getRollbackSuccessTitle(selectedActivity.resourceType, t),
                getRollbackSuccessDescription(selectedActivity.resourceType, t),
              ),
            );
            onRefresh();
            if (refresh) {
              router.refresh();
            }
          } else {
            showNotification(
              getErrorNotification(
                getRollbackErrorTitle(selectedActivity.resourceType, t),
                getRollbackErrorDescription(selectedActivity.resourceType, t),
              ),
            );
          }
        })
        .catch(() => {
          setIsLoading(false);
          showNotification(
            getErrorNotification(
              getRollbackErrorTitle(selectedActivity.resourceType, t),
              getRollbackErrorDescription(selectedActivity.resourceType, t),
            ),
          );
        });
    }
  }, [selectedActivity, onCloseModal, showNotification, t, onRefresh, refresh, router]);

  const systemRollback = useCallback(() => {
    router.push(`${ApplicationRoute.ActivityAudit}/${SYSTEM_ROLLBACK_ID}`);
  }, [router]);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  return (
    <div role="activities" className="flex flex-col flex-1 min-h-0 w-full relative">
      <ListView
        additionalGridOptions={gridOptions}
        columnDefs={columnDefs}
        title={!entity ? t(listViewTitleMap[ApplicationRoute.ActivityAudit]) : void 0}
        emptyDataTitle={t(emptyDataTitleMap[ApplicationRoute.ActivityAudit])}
        onGridReady={onGridReady}
        view={!entity ? ApplicationRoute.ActivityAudit : void 0}
      >
        <div className={classNames('flex gap-4', entity ? 'flex-1 justify-between' : 'justify-end')}>
          {!entity && <ResetFiltersButton gridApi={gridApi} />}
          {timePeriod && (
            <TimeFilter
              timePeriod={timePeriod as string}
              onTimePeriodChange={onTimePeriodChange}
              timeRange={timeRange}
              onTimeRangeChange={onTimeRangeChange}
              isCustomRange={isCustomRange}
              setIsCustomRange={setIsCustomRange}
            />
          )}

          <div className="flex flex-row gap-x-4">
            {entity && <ResetFiltersButton gridApi={gridApi} />}
            <DialNeutralButton
              label={t(ButtonsI18nKey.Refresh)}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onRefresh}
            />
          </div>

          {!entity && (
            <DialNeutralButton
              iconBefore={<IconRestore {...BASE_BUTTON_ICON_PROPS} />}
              label={t(RollbackI18nKey.Rollback)}
              onClick={systemRollback}
            />
          )}
        </div>
      </ListView>
      {isRollbackModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isRollbackModalOpen}
            isLoading={isLoading}
            header={t(RollbackI18nKey.ConfirmResourceRollbackTitle)}
            onConfirm={resourceRollback}
            confirmLabel={t(ButtonsI18nKey.Rollback)}
            onClose={onCloseModal}
          >
            <div className="text-secondary small-150 px-6 py-4">
              <p>
                <span>{t(RollbackI18nKey.ConfirmRollbackDescriptionPart1)}</span>
                <span className="important-text-part mx-1">{selectedActivity?.activityType}</span>
                <span>{t(RollbackI18nKey.ConfirmRollbackDescriptionPart2)}</span>
                <DialTooltip tooltip={selectedActivity?.resourceId || ''} triggerClassName="flex-1">
                  <span className="important-text-part mx-1 my-1">{selectedActivity?.resourceId}</span>
                </DialTooltip>
                <span>{t(RollbackI18nKey.ConfirmRollbackDescriptionPart3)}</span>
                <span className="important-text-part">
                  {formatDateTimeToLocalString(selectedActivity?.epochTimestampMs)}
                </span>
              </p>
              <p>{t(RollbackI18nKey.ConfirmRollbackAsking)}</p>
            </div>
          </DialConfirmationPopup>,
          document.body,
        )}
      {isDetailsModalOpen &&
        createPortal(
          <ActivityDetails
            entity={entity}
            auditViewId={selectedActivity?.activityId}
            isModalOpen={isDetailsModalOpen}
            onClose={onCloseModal}
          />,
          document.body,
        )}
    </div>
  );
};

export default ActivityAuditList;
