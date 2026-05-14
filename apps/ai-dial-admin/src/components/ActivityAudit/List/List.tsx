'use client';

import { usePathname, useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  DialConfirmationPopup,
  DialGhostButton,
  DialNeutralButton,
  DialSelect,
  DialTooltip,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';
import { IconRefresh, IconRestore } from '@tabler/icons-react';
import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import classNames from 'classnames';

import { getActivities, getDeploymentActivities } from '@/src/app/[lang]/activity-audit/actions';
import {
  getActivityAuditColumns,
  getAuditActivityHref,
  getDeploymentActivityAuditColumns,
  getEndOfDay,
  getGridFilters,
  getStartOfDay,
} from '@/src/components/ActivityAudit/List/utils';
import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID, EXPANDER_COLUMN_CEL_ID, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, CompareI18nKey, RollbackI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FilterDto } from '@/src/models/request';
import { TimeFilterValue, TimeRange } from '@/src/models/time-range';
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
import { saveAuditTabReturn } from '@/src/utils/audit-tab-return';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { ActivityAuditResourceType, ActivityAuditView, isDeploymentManagerResource } from '@/src/types/activity-audit';
import { ACTIVITY_AUDIT_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  entity?: BaseEntity | DialApplicationScheme;
  entityType?: string;
  refresh?: boolean;
  defaultTimeFilter?: TimeFilterValue;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
}

const ActivityAuditList: FC<Props> = ({ entity, entityType, refresh, defaultTimeFilter, onTimeFilterChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const { showNotification } = useNotification();

  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const { timePeriod, timeRange, isCustom, onTimePeriodChange, onTimeRangeChange } = useTimeFilter({
    defaultTimeFilter,
    onTimeFilterChange,
  });
  const [selectedActivity, setSelectedActivity] = useState<DialActivity | undefined>(void 0);
  const [activityViewType, setActivityViewType] = useState<ActivityAuditView>(ActivityAuditView.Config);
  const [fullActivityList, setFullActivityList] = useState<DialActivity[]>([]);

  const onCloseModal = useCallback(() => {
    setIsRollbackModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedActivity(void 0);
  }, [setIsRollbackModalOpen]);

  const openInNewTab = useCallback(
    (activity?: DialActivity) => {
      if (activityViewType === ActivityAuditView.Deployments && !isDeploymentManagerResource(activity?.resourceType)) {
        return;
      }
      onOpenInNewTab(ApplicationRoute.ActivityAudit, activity);
    },
    [activityViewType],
  );

  const onOpenConfirmationModal = useCallback((activity?: DialActivity) => {
    setIsRollbackModalOpen(true);
    setSelectedActivity(activity);
  }, []);

  const getProcessedActivityMap = useCallback(
    (data: DialActivity[]) => {
      const activityMap: Record<
        string,
        DialActivity & { children?: DialActivity[]; canToggleExpand?: boolean; expanded?: boolean }
      > = {};

      const existingIds = new Set(fullActivityList.map((a) => a.activityId));
      const newActivities = data
        .filter((a) => !existingIds.has(a.activityId))
        .map((a) => ({
          ...a,
          resourceId:
            a.resourceType === ActivityAuditResourceType.ADMIN_PROPERTIES ||
            a.resourceType === ActivityAuditResourceType.SYSTEM_PROPERTIES
              ? ''
              : a.resourceId,
        }));
      const updatedActivityList = [...fullActivityList, ...newActivities];
      setFullActivityList(updatedActivityList);

      updatedActivityList.forEach((activity) => {
        if (!activity.parentActivityId) {
          activityMap[activity.activityId] = {
            ...activity,
            children: updatedActivityList.filter((a) => a.parentActivityId === activity.activityId),
            expanded: true,
            canToggleExpand: false,
          };
        }
      });

      return activityMap;
    },
    [fullActivityList],
  );

  const isDeploymentsView = activityViewType === ActivityAuditView.Deployments;

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        const actualTimeRange = isCustom
          ? { startDate: getStartOfDay(timeRange.startDate), endDate: getEndOfDay(timeRange.endDate) }
          : getTimeRangeById(timePeriod || '');
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

        const fetchActivities = isDeploymentsView ? getDeploymentActivities : getActivities;

        fetchActivities(PAGE_SIZE, page, sorts, filters)
          .then((res) => {
            if (res == null || res.data.length === 0) {
              params.successCallback([], 0);
            } else if (isDeploymentsView || entity) {
              params.successCallback(res.data, page + 1 === res.totalPages ? res.total : void 0);
            } else {
              const activityMap: Record<
                string,
                DialActivity & { children?: DialActivity[]; canToggleExpand?: boolean; expanded?: boolean }
              > = getProcessedActivityMap(res.data);

              const newData: DialActivity[] = [];
              res.data.forEach((activity: DialActivity) => {
                if (!activity?.parentActivityId) {
                  const activityWithChildren = {
                    ...activity,
                    resourceId:
                      activity.resourceType === ActivityAuditResourceType.ADMIN_PROPERTIES ||
                      activity.resourceType === ActivityAuditResourceType.SYSTEM_PROPERTIES
                        ? ''
                        : activity.resourceId,
                    children: activityMap[activity.activityId]?.children || [],
                    expanded: true,
                    canToggleExpand: false,
                  };
                  newData.push(activityWithChildren);
                }

                newData.push(...(activityMap[activity.activityId]?.children || []));
              });
              params.successCallback(newData, page + 1 === res.totalPages ? res.total : void 0);
            }
            gridApi?.setGridOption('loading', false);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCustom, timePeriod, timeRange, gridApi, entity, entityType, isDeploymentsView],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  useEffect(() => {
    if (!gridApi || entity) {
      return;
    }
    gridApi.setFilterModel(null);
    setFullActivityList([]);
    gridApi.setGridOption('datasource', gridDataSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityViewType]);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    onCellClicked: (e) => {
      if (isDeploymentsView && !isDeploymentManagerResource(e.data?.resourceType)) {
        return;
      }
      if (e.data?.children?.length > 0) {
        return;
      }

      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID && e.colDef.field !== EXPANDER_COLUMN_CEL_ID) {
        if (entity) {
          const href = getAuditActivityHref(entity, entityType as ActivityAuditResourceType, e.data.activityId);
          if (href) {
            saveAuditTabReturn(pathname);
            router.push(href);
          }
        } else {
          router.push(getUrnForEntity(ApplicationRoute.ActivityAudit, e.data));
        }
      }
    },
  };

  const columnDefs = useMemo(() => {
    if (entity) {
      return [...ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Config, true)];
    }
    if (isDeploymentsView) {
      return getDeploymentActivityAuditColumns(t, openInNewTab);
    }
    return getActivityAuditColumns(
      t,
      openInNewTab,
      isReadOnlyAdmin ? undefined : onOpenConfirmationModal,
      void 0,
      void 0,
    );
  }, [entity, isDeploymentsView, t, openInNewTab, isReadOnlyAdmin, onOpenConfirmationModal]);

  const onRefresh = useCallback(() => {
    if (gridApi) {
      gridApi.setGridOption('loading', true);

      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const handleTimePeriodChange = useCallback(
    (period: string) => {
      onTimePeriodChange(period);
      onRefresh();
    },
    [onTimePeriodChange, onRefresh],
  );

  const handleTimeRangeChange = useCallback(
    (range: TimeRange, custom?: boolean) => {
      onTimeRangeChange(range, custom);
      onRefresh();
    },
    [onTimeRangeChange, onRefresh],
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

  const onActivityViewChange = useCallback((val: ActivityAuditView) => {
    setActivityViewType(val);
  }, []);

  const activityViewOptions = useMemo(
    () => [
      { value: ActivityAuditView.Config, label: t(TelemetryI18nKey.ActivityViewConfig) },
      { value: ActivityAuditView.Deployments, label: t(TelemetryI18nKey.ActivityViewDeployments) },
      { value: ActivityAuditView.Asset, label: t(TelemetryI18nKey.ActivityViewAsset), disabled: true },
    ],
    [t],
  );

  return (
    <div role="activities" className="flex flex-col flex-1 min-h-0 w-full relative">
      <ListView
        key={!entity ? activityViewType : void 0}
        additionalGridOptions={gridOptions}
        columnDefs={columnDefs}
        title={!entity ? t(listViewTitleMap[ApplicationRoute.ActivityAudit]) : void 0}
        emptyDataTitle={t(emptyDataTitleMap[ApplicationRoute.ActivityAudit])}
        onGridReady={onGridReady}
        view={!entity ? ApplicationRoute.ActivityAudit : void 0}
        storageKey={!entity ? `${ApplicationRoute.ActivityAudit}:${activityViewType.toLowerCase()}` : void 0}
      >
        <div className={classNames('flex gap-4', entity ? 'flex-1 justify-between' : 'justify-end')}>
          {entity && (
            <TimeFilter
              timePeriod={timePeriod}
              onTimePeriodChange={handleTimePeriodChange}
              timeRange={timeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          )}
          <div className="flex gap-4">
            {entity && <ResetFiltersButton gridApi={gridApi} />}
            <DialGhostButton
              label={t(ButtonsI18nKey.Refresh)}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onRefresh}
            />
          </div>
        </div>
        <div className="flex flex-row flex-wrap justify-between mt-4 w-full">
          {!entity && (
            <div className="flex flex-row gap-x-4 h-[40px] items-center">
              <DialSelect
                size={SelectSize.Sm}
                variant={SelectVariant.Secondary}
                prefix={`${t(CompareI18nKey.View)}:`}
                options={activityViewOptions}
                value={activityViewType}
                onChange={(val) => onActivityViewChange(val as ActivityAuditView)}
              />
              <TimeFilter
                timePeriod={timePeriod}
                onTimePeriodChange={handleTimePeriodChange}
                timeRange={timeRange}
                onTimeRangeChange={handleTimeRangeChange}
              />
              <ResetFiltersButton gridApi={gridApi} />
            </div>
          )}

          {!entity && !isReadOnlyAdmin && activityViewType === ActivityAuditView.Config && (
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
                  <span className="important-text-part m-1">{selectedActivity?.resourceId}</span>
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
