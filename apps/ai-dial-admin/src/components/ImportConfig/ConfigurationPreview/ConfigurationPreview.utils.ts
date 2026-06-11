import { TabModel } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { isNull, startCase } from 'lodash';

import StatusCellRenderer from '@/src/components/Grid/CellRenderers/StatusCellRenderer';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getCompareChangesOperation } from '@/src/constants/grid-columns/actions';
import {
  APPLICATIONS_COLUMNS,
  KEYS_COLUMNS,
  LIST_RUNNER_COLUMNS,
  MODELS_COLUMNS,
  BASE_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { DEPLOYMENT_ENTITY_TABS } from '@/src/components/ExportConfig/deployment-utils';
import {
  COMPONENT_TYPE_TO_TAB_ID,
  DEPLOYMENT_RESPONSE_KEYS,
  GLOBAL_FIREWALL_TAB_ID,
} from '@/src/constants/deployments/import';
import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { ROW_IMPORT_META_KEY } from '@/src/constants/import';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity, ChatEntity } from '@/src/models/dial/base-entity';
import { FileComponentItem, FileConfiguration } from '@/src/models/import';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { DeploymentImportPreviewResponse } from '@/src/models/deployments/preview';
import { EntityType } from '@/src/types/entity-type';
import { ImportConfigurationAction } from '@/src/types/import';
import { ExportConfigComponentType, ValidationError, ValidationState } from '@/src/types/deployments/import';
import { RowImportMeta, ValidationSummary } from '@/src/models/deployments/import';
import { getEntitiesList } from '@/src/utils/entities/get-entities-list';

const getConfigurationItems = (componentItems: FileComponentItem[], t: (v: string) => string) => {
  return componentItems?.map((componentItem) => ({
    action: t(`Import.${startCase(componentItem?.importAction)}`),
    ...componentItem?.next,
  }));
};

const getPrevItems = (componentItems: FileComponentItem[]) => {
  return componentItems?.map((componentItem) => componentItem?.prev).filter(Boolean);
};

const getConfigurationTabs = (preview: Record<string, BaseEntity[]>, t: (v: string) => string): TabModel[] => {
  return getEntitiesList(t)
    ?.map((entityTab) => {
      const previewItem = preview[entityTab.id];

      if (previewItem && previewItem.length) {
        return {
          ...entityTab,
          label: `${entityTab.name} (${previewItem.length})`,
        };
      }
      return null;
    })
    .filter((entityTab) => !isNull(entityTab));
};

export const getConfigurationPreview = (configuration: FileConfiguration, t: (v: string) => string) => {
  const previewData: Record<string, BaseEntity[]> = {};
  const prevData: Record<string, (BaseEntity | undefined)[]> = {};

  Object.keys(configuration).forEach((configurationKey) => {
    if (configuration[configurationKey]) {
      const configurationItems = getConfigurationItems(configuration[configurationKey], t);
      const prevItems = getPrevItems(configuration[configurationKey]);

      if (configurationKey === 'models') {
        previewData[EntityType.MODEL] = configurationItems;
        prevData[EntityType.MODEL] = prevItems;
      }

      if (configurationKey === 'adapters') {
        previewData[EntityType.ADAPTER] = configurationItems;
        prevData[EntityType.ADAPTER] = prevItems;
      }

      if (configurationKey === 'applications') {
        previewData[EntityType.APPLICATION] = configurationItems;
        prevData[EntityType.APPLICATION] = prevItems;
      }

      if (configurationKey === 'routes') {
        previewData[EntityType.ROUTE] = configurationItems;
        prevData[EntityType.ROUTE] = prevItems;
      }

      if (configurationKey === 'roles') {
        previewData[EntityType.ROLE] = configurationItems;
        prevData[EntityType.ROLE] = prevItems;
      }

      if (configurationKey === 'keys') {
        previewData[EntityType.KEY] = configurationItems;
        prevData[EntityType.KEY] = prevItems;
      }

      if (configurationKey === 'applicationRunners') {
        previewData[EntityType.APPLICATION_TYPE_SCHEMA] = configurationItems;
        prevData[EntityType.APPLICATION_TYPE_SCHEMA] = prevItems;
      }

      if (configurationKey === 'interceptors') {
        previewData[EntityType.INTERCEPTOR] = configurationItems;
        prevData[EntityType.INTERCEPTOR] = prevItems;
      }

      if (configurationKey === 'prompts') {
        previewData[EntityType.PROMPT] = configurationItems;
        prevData[EntityType.PROMPT] = prevItems;
      }

      if (configurationKey === 'files') {
        previewData[EntityType.FILE] = configurationItems;
        prevData[EntityType.FILE] = prevItems;
      }

      if (configurationKey === 'toolSets') {
        previewData[EntityType.TOOLSET] = configurationItems;
        prevData[EntityType.TOOLSET] = prevItems;
      }
    }
  });

  return { previewData, prevData, tabs: getConfigurationTabs(previewData, t) };
};

export const getActionClassName = (action: string): string => {
  if (action === ImportConfigurationAction.CREATE) {
    return 'bg-accent-primary';
  }
  if (action === ImportConfigurationAction.UPDATE) {
    return 'bg-orange-400';
  }
  return 'bg-controls-disable';
};

export const getComponentActionColumn = (): ColDef => {
  return {
    field: 'action',
    headerName: 'Action',
    cellRenderer: StatusCellRenderer,
    cellRendererParams: (params: ICellRendererParams) => {
      return {
        statusClassName: getActionClassName(params.value),
      };
    },
  };
};

export const getComponentColDefs = (
  type: string,
  t: (v: string) => string,
  compare: (entity?: BaseEntity) => void,
): ColDef[] => {
  const actionColumn = ACTION_COLUMN([getCompareChangesOperation(compare)]);
  if (type === EntityType.MODEL) {
    return [getComponentActionColumn(), ...MODELS_COLUMNS(t), actionColumn];
  }

  if (type === EntityType.APPLICATION) {
    return [getComponentActionColumn(), ...APPLICATIONS_COLUMNS(t), actionColumn];
  }

  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    return [
      getComponentActionColumn(),
      ...LIST_RUNNER_COLUMNS.filter((col) => col.field !== 'updatedAt'),
      actionColumn,
    ];
  }

  if (type === EntityType.KEY) {
    return [getComponentActionColumn(), ...KEYS_COLUMNS(t), actionColumn];
  }

  return [getComponentActionColumn(), ...BASE_COLUMNS, actionColumn];
};

export const getEntityByIdentifier = (allEntities: ActivityAuditEntity[], entity?: BaseEntity): ActivityAuditEntity => {
  return allEntities.find(
    (e) => e?.name === (entity as ChatEntity)?.name || (e?.$id && e?.$id === (entity as DialApplicationScheme)?.$id),
  ) as ActivityAuditEntity;
};

export const filterArtifactErrors = (errors: ValidationError[] | undefined): ValidationError[] => {
  if (!errors) return [];
  return errors.filter((e) => e.entityType !== ExportConfigComponentType.GLOBAL_DOMAIN_WHITELIST);
};

const errorKey = (entityType: string, entityIdentifier: string): string => `${entityType}::${entityIdentifier}`;

export const groupErrorsByEntity = (errors: ValidationError[]): Map<string, ValidationError[]> => {
  const grouped = new Map<string, ValidationError[]>();
  for (const error of errors) {
    const key = errorKey(error.entityType, error.entityIdentifier);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(error);
    } else {
      grouped.set(key, [error]);
    }
  }
  return grouped;
};

export const buildErrorsByTab = (errors: ValidationError[]): Partial<Record<DeploymentExportEntityType, number>> => {
  const seenByTab: Partial<Record<DeploymentExportEntityType, Set<string>>> = {};
  for (const error of errors) {
    const tabId = COMPONENT_TYPE_TO_TAB_ID[error.entityType as ExportConfigComponentType];
    if (!tabId) continue;
    const key = errorKey(error.entityType, error.entityIdentifier);
    if (!seenByTab[tabId]) seenByTab[tabId] = new Set();
    seenByTab[tabId]!.add(key);
  }
  const counts: Partial<Record<DeploymentExportEntityType, number>> = {};
  for (const [tabId, keys] of Object.entries(seenByTab) as [DeploymentExportEntityType, Set<string>][]) {
    counts[tabId] = keys.size;
  }
  return counts;
};

export const formatValidationLine = (e: ValidationError): string =>
  e.fieldPath ? `${e.fieldPath}: ${e.message}` : e.message;

interface DeploymentRowEntry {
  item: FileComponentItem;
  componentType: ExportConfigComponentType;
}

const getRowCandidateIdentifiers = (item: FileComponentItem): string[] => {
  type Side = { name?: string; id?: string; version?: string } | undefined;
  const next = item.next as Side;
  const prev = item.prev as Side;
  const candidates: (string | undefined)[] = [];
  for (const side of [next, prev]) {
    if (!side) continue;
    candidates.push(side.name);
    candidates.push(side.id);
    if (side.name && side.version) candidates.push(`${side.name}(${side.version})`);
  }
  return Array.from(new Set(candidates.filter((v): v is string => typeof v === 'string' && v.length > 0)));
};

const buildRowImportMeta = (
  item: FileComponentItem,
  componentType: ExportConfigComponentType,
  groupedErrors: Map<string, ValidationError[]>,
): RowImportMeta => {
  for (const candidate of getRowCandidateIdentifiers(item)) {
    const matched = groupedErrors.get(errorKey(componentType, candidate));
    if (matched && matched.length > 0) {
      return { validationState: ValidationState.FAILED, validationErrors: matched };
    }
  }
  return { validationState: ValidationState.VALIDATED, validationErrors: [] };
};

export const getDeploymentConfigurationPreview = (
  response: DeploymentImportPreviewResponse,
  t: (v: string) => string,
): {
  previewData: Record<string, BaseEntity[]>;
  prevData: Record<string, (BaseEntity | undefined)[]>;
  tabs: TabModel[];
  globalFirewall: FileComponentItem | null;
  firewallErrorsByDomain: Record<string, string[]>;
  validationSummary: ValidationSummary;
} => {
  const filteredErrors = filterArtifactErrors(response.validationErrors);
  const groupedErrors = groupErrorsByEntity(filteredErrors);
  const errorsByTab = buildErrorsByTab(filteredErrors);

  const firewallErrors = (response.validationErrors ?? []).filter(
    (e) => e.entityType === ExportConfigComponentType.GLOBAL_DOMAIN_WHITELIST,
  );
  const firewallErrorsByDomain = firewallErrors.reduce<Record<string, string[]>>((acc, e) => {
    (acc[e.entityIdentifier] ??= []).push(e.message);
    return acc;
  }, {});

  const grouped: Record<string, DeploymentRowEntry[]> = {};

  for (const [key, componentType] of Object.entries(DEPLOYMENT_RESPONSE_KEYS)) {
    const items = response[key as keyof DeploymentImportPreviewResponse] as FileComponentItem[] | null;
    if (!items?.length) continue;
    const tabId = COMPONENT_TYPE_TO_TAB_ID[componentType];
    if (!tabId) continue;
    if (!grouped[tabId]) grouped[tabId] = [];
    for (const item of items) {
      grouped[tabId].push({ item, componentType });
    }
  }

  const previewData: Record<string, BaseEntity[]> = {};
  const prevData: Record<string, (BaseEntity | undefined)[]> = {};
  const tabs: TabModel[] = [];

  for (const { id, labelKey } of DEPLOYMENT_ENTITY_TABS) {
    const entries = grouped[id];
    if (entries && entries.length > 0) {
      const items = entries.map((entry) => entry.item);
      const baseItems = getConfigurationItems(items, t);
      const enrichedBase = baseItems.map((row, index) => {
        const entry = entries[index];
        return {
          ...row,
          [ROW_IMPORT_META_KEY]: buildRowImportMeta(entry.item, entry.componentType, groupedErrors),
        };
      });

      previewData[id] =
        id === DeploymentExportEntityType.IMAGE
          ? enrichedBase.map((item, index) => ({
              ...item,
              displayName: item.name,
              name: (items[index]?.prev as { id?: string } | undefined)?.id ?? '',
            }))
          : enrichedBase;
      prevData[id] = getPrevItems(items);
      tabs.push({
        id,
        label: `${t(labelKey)}: ${items.length}`,
        invalid: (errorsByTab[id] ?? 0) > 0,
      });
    }
  }

  const globalFirewall = response.globalImageBuildDomainWhitelist;
  if (globalFirewall) {
    tabs.push({
      id: GLOBAL_FIREWALL_TAB_ID,
      label: t(DeploymentsI18nKey.GlobalFirewall),
      invalid: firewallErrors.length > 0,
    });
  }

  const validationSummary: ValidationSummary = {
    totalFailed: groupedErrors.size + firewallErrors.length,
    errorsByTab,
  };

  return { previewData, prevData, tabs, globalFirewall, firewallErrorsByDomain, validationSummary };
};
