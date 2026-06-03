'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { buildResourceTypeLabelMap, getFormattedResourceType } from '@/src/constants/grid-columns/formatters';
import { RESOURCE_TYPE_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import {
  getActivityAuditColumns,
  getAuditActivityHref,
  getDeploymentActivityAuditColumns,
  getEndOfDay,
  getGridFilters,
  getStartOfDay,
  processActivitiesData,
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
import { AuditListPreselect } from '@/src/types/audit-list-preselect';
import { clearAuditListPreselect, readAuditListPreselect } from '@/src/utils/audit-list-preselect';
import {
  needsDeploymentLifecycleCheck,
  resolveDeploymentRollbackBlockReason,
} from '@/src/utils/audit/deployment-lifecycle-check';
import { rollbackDeploymentEntity } from '@/src/utils/audit/get-deployment-rollback-request';
import { rollbackEntityPerType } from '@/src/utils/audit/get-rollback-request';
import { getRollbackNavigation, RollbackRedirectTarget } from '@/src/utils/audit/get-rollback-navigation';
import {
  getRollbackErrorDescription,
  getRollbackErrorTitle,
  getRollbackSuccessDescription,
  getRollbackSuccessTitle,
} from '@/src/utils/entities/rollback-entity';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityAuditFilterId, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import {
  ActivityAuditResourceType,
  ActivityAuditType,
  ActivityAuditView,
  isDeploymentManagerResource,
} from '@/src/types/activity-audit';
import { FilterOperatorDto } from '@/src/types/request';

interface Props {
  entity?: BaseEntity | DialApplicationScheme;
  entityType?: string;
  refresh?: boolean;
  defaultTimeFilter?: TimeFilterValue;
  onTimeFilterChange?: (filter: TimeFilterValue) => void;
  viewMode?: ActivityAuditView;
}

const ActivityAuditList: FC<Props> = ({
  entity,
  entityType,
  refresh,
  defaultTimeFilter,
  onTimeFilterChange,
  viewMode,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const router = useRouter();
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
  const [rollbackBlockReason, setRollbackBlockReason] = useState<RollbackI18nKey | null>(null);
  const [isCheckingState, setIsCheckingState] = useState(false);
  const [preselect] = useState(() => (entity ? null : readAuditListPreselect()));
  const [activityViewType, setActivityViewType] = useState<ActivityAuditView>(() => {
    if (preselect === AuditListPreselect.GlobalFirewall || preselect === AuditListPreselect.Deployments) {
      return ActivityAuditView.Deployments;
    }
    if (preselect === AuditListPreselect.Config) {
      return ActivityAuditView.Config;
    }
    return viewMode ?? ActivityAuditView.Config;
  });
  const effectiveViewType = viewMode ?? activityViewType;
  const resourceTypeLabelMap = useMemo(() => buildResourceTypeLabelMap(t), [t]);
  const hasAppliedPreselectRef = useRef(false);
  const childrenCacheRef = useRef<Record<string, DialActivity[]>>({});
  const rowBufferRef = useRef<DialActivity[]>([]);
  const apiPageRef = useRef(0);
  const apiExhaustedRef = useRef(false);

  const onCloseModal = useCallback(() => {
    setIsRollbackModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedActivity(void 0);
    setRollbackBlockReason(null);
    setIsCheckingState(false);
  }, [setIsRollbackModalOpen]);

  const openInNewTab = useCallback(
    (activity?: DialActivity) => {
      if (effectiveViewType === ActivityAuditView.Deployments && !isDeploymentManagerResource(activity?.resourceType)) {
        return;
      }
      onOpenInNewTab(ApplicationRoute.ActivityAudit, activity);
    },
    [effectiveViewType],
  );

  const openInNewTabForEntity = useCallback(
    (activity?: DialActivity) => {
      const href = getAuditActivityHref(entity, entityType as ActivityAuditResourceType, activity?.activityId);
      if (href) {
        window.open(href, '_blank');
      }
    },
    [entity, entityType],
  );

  const onOpenConfirmationModal = useCallback((activity?: DialActivity) => {
    setIsRollbackModalOpen(true);
    setSelectedActivity(activity);
    setRollbackBlockReason(null);

    if (!activity || !needsDeploymentLifecycleCheck(activity)) {
      return;
    }

    setIsCheckingState(true);
    resolveDeploymentRollbackBlockReason(activity)
      .then((reason) => setRollbackBlockReason(reason))
      .finally(() => setIsCheckingState(false));
  }, []);

  const isDeploymentsView = effectiveViewType === ActivityAuditView.Deployments;

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const { startRow, endRow } = params;

        if (startRow === 0) {
          rowBufferRef.current = [];
          apiPageRef.current = 0;
          apiExhaustedRef.current = false;
          childrenCacheRef.current = {};
        }

        const actualTimeRange = isCustom
          ? { startDate: getStartOfDay(timeRange.startDate), endDate: getEndOfDay(timeRange.endDate) }
          : getTimeRangeById(timePeriod || '');
        gridApi?.setGridOption('loading', true);
        const sorts = getRequestSorts(params.sortModel);
        const filters = [
          ...(entity
            ? [
                {
                  column: 'resourceId',
                  value: getEntityAuditFilterId(entity),
                  operator: FilterOperatorDto.EQUALS,
                } as FilterDto,
                {
                  column: RESOURCE_TYPE_COLUMN,
                  value: entityType,
                  operator: FilterOperatorDto.EQUALS,
                } as FilterDto,
              ]
            : []),
          ...getGridFilters(params.filterModel, actualTimeRange, resourceTypeLabelMap),
        ];

        const fetchActivities = isDeploymentsView ? getDeploymentActivities : getActivities;

        try {
          while (rowBufferRef.current.length < endRow && !apiExhaustedRef.current) {
            const page = apiPageRef.current;
            const res = await fetchActivities(PAGE_SIZE, page, sorts, filters);
            apiPageRef.current++;

            if (!res || res.data.length === 0) {
              apiExhaustedRef.current = true;
              break;
            }

            if (isDeploymentsView || entity) {
              rowBufferRef.current.push(...res.data);
            } else {
              const missingParentIds = res.data
                .filter((a) => !a.parentActivityId && !childrenCacheRef.current[a.activityId])
                .map((a) => a.activityId);

              if (missingParentIds.length > 0) {
                const childrenFilters: FilterDto[] = [
                  {
                    column: 'parentActivityId',
                    value: missingParentIds.join(','),
                    operator: FilterOperatorDto.INCLUDES,
                  },
                ];

                const childrenRes = await fetchActivities(PAGE_SIZE, 0, sorts, childrenFilters);
                const allChildren: DialActivity[] = childrenRes?.data ?? [];
                for (let p = 1; p < (childrenRes?.totalPages ?? 1); p++) {
                  const next = await fetchActivities(PAGE_SIZE, p, sorts, childrenFilters);
                  if (next?.data) allChildren.push(...next.data);
                }

                allChildren.forEach((child) => {
                  if (!child.parentActivityId) return;
                  if (!childrenCacheRef.current[child.parentActivityId]) {
                    childrenCacheRef.current[child.parentActivityId] = [];
                  }
                  if (
                    !childrenCacheRef.current[child.parentActivityId].some((c) => c.activityId === child.activityId)
                  ) {
                    childrenCacheRef.current[child.parentActivityId].push(child);
                  }
                });
              }

              rowBufferRef.current.push(...processActivitiesData(res.data, childrenCacheRef.current));
            }

            if (page + 1 >= (res?.totalPages ?? 1)) {
              apiExhaustedRef.current = true;
            }
          }

          const slice = rowBufferRef.current.slice(startRow, endRow);
          const lastRow = apiExhaustedRef.current ? rowBufferRef.current.length : undefined;
          params.successCallback(slice, lastRow);
        } catch {
          params.failCallback();
        } finally {
          gridApi?.setGridOption('loading', false);
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCustom, timePeriod, timeRange, gridApi, entity, entityType, isDeploymentsView, resourceTypeLabelMap],
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
    childrenCacheRef.current = {};
    gridApi.setGridOption('datasource', gridDataSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveViewType]);

  // A view-only preselect (set by a rollback redirect) is consumed once on mount.
  useEffect(() => {
    if (entity) {
      return;
    }
    if (preselect === AuditListPreselect.Config || preselect === AuditListPreselect.Deployments) {
      clearAuditListPreselect();
    }
  }, [entity, preselect]);

  useEffect(() => {
    if (!gridApi || hasAppliedPreselectRef.current || preselect !== AuditListPreselect.GlobalFirewall) {
      return;
    }
    hasAppliedPreselectRef.current = true;
    gridApi.setFilterModel({
      [RESOURCE_TYPE_COLUMN]: {
        filterType: 'text',
        type: 'contains',
        filter: getFormattedResourceType(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, t),
      },
    });
    clearAuditListPreselect();
  }, [gridApi, preselect, t]);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    rowSelection: { mode: 'singleRow', enableClickSelection: false, checkboxes: false },
    rowClassRules: {
      'ag-activity-row-clickable': (params) => {
        const data = params.data as DialActivity & { children?: DialActivity[] };
        if (isDeploymentsView && !isDeploymentManagerResource(data?.resourceType)) return false;
        return !data?.children?.length;
      },
    },
    onCellClicked: (e) => {
      if (isDeploymentsView && !isDeploymentManagerResource(e.data?.resourceType)) {
        return;
      }
      if (e.data?.activityType === ActivityAuditType.Rollback || e.data?.activityType === ActivityAuditType.Import) {
        return;
      }

      e.node.setSelected(true, true);

      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID && e.colDef.field !== EXPANDER_COLUMN_CEL_ID) {
        if (entity) {
          openInNewTabForEntity(e.data);
        } else {
          openInNewTab(e.data);
        }
      }
    },
  };

  const columnDefs = useMemo(() => {
    if (entity) {
      return getActivityAuditColumns(
        t,
        openInNewTabForEntity,
        isReadOnlyAdmin ? undefined : onOpenConfirmationModal,
        void 0,
        true,
      );
    }
    if (isDeploymentsView) {
      return getDeploymentActivityAuditColumns(t, openInNewTab, isReadOnlyAdmin ? undefined : onOpenConfirmationModal);
    }
    return getActivityAuditColumns(
      t,
      openInNewTab,
      isReadOnlyAdmin ? undefined : onOpenConfirmationModal,
      void 0,
      void 0,
    );
  }, [entity, isDeploymentsView, t, openInNewTab, openInNewTabForEntity, isReadOnlyAdmin, onOpenConfirmationModal]);

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
      const isDeployment = isDeploymentManagerResource(selectedActivity.resourceType);
      const isRecreate = isDeployment && selectedActivity.activityType === ActivityAuditType.Delete;
      const rollbackRequest = isDeployment
        ? rollbackDeploymentEntity(selectedActivity)
        : rollbackEntityPerType(selectedActivity);
      rollbackRequest
        .then((res) => {
          setIsLoading(false);
          onCloseModal();
          if (res?.success) {
            showNotification(
              getSuccessNotification(
                getRollbackSuccessTitle(selectedActivity.resourceType, t),
                isRecreate
                  ? t(RollbackI18nKey.NotificationSuccessRecreateDescription)
                  : getRollbackSuccessDescription(selectedActivity.resourceType, t),
              ),
            );
            const nav = getRollbackNavigation(
              selectedActivity.activityType,
              selectedActivity.resourceType,
              decodeURIComponent(selectedActivity.resourceId ?? ''),
              !!entity,
              res?.response,
            );
            if (nav.target === RollbackRedirectTarget.EntityList) {
              router.push(nav.entityListHref ?? ApplicationRoute.ActivityAudit);
            } else if (nav.target === RollbackRedirectTarget.EntityDetail) {
              router.push(nav.entityDetailHref ?? ApplicationRoute.ActivityAudit);
            } else if (nav.target === RollbackRedirectTarget.Refresh) {
              // Entity audit tab → reload the entity page; otherwise reload the grid in place.
              if (refresh) {
                router.refresh();
              } else {
                onRefresh();
              }
            } else {
              // Already on the activity-audit list → reload the grid in place.
              onRefresh();
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
  }, [selectedActivity, onCloseModal, showNotification, t, onRefresh, refresh, router, entity]);

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
          {!entity && !viewMode && (
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

          {!entity && !isReadOnlyAdmin && effectiveViewType === ActivityAuditView.Config && (
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
            disableConfirmButton={isCheckingState || !!rollbackBlockReason}
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
              {rollbackBlockReason ? (
                <p className="text-error">{t(rollbackBlockReason)}</p>
              ) : (
                <p>{t(RollbackI18nKey.ConfirmRollbackAsking)}</p>
              )}
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
