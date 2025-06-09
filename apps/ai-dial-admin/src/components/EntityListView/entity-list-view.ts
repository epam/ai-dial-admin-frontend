import { ColDef } from 'ag-grid-community';

import SelectCellRenderer from '@/src/components/Grid/CellRenderer/SelectCellRenderer';
import TopicsCellRenderer from '@/src/components/Grid/CellRenderer/TopicCellRenderer';
import KeyStatusCellRenderer from '@/src/components/KeysList/KeyStatus/KeyStatusCellRenderer';
import { ACTION_COLUMN, NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey, CreateI18nKey, DeleteI18nKey, EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getFormatterAdapter } from '@/src/utils/adapter';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getMoveOperation,
  getOpenInNewTabOperation,
} from '@/src/utils/entities/entity-operations';
import { formatTimestampToDate } from '@/src/utils/formatting/date';

export const SIMPLE_VERSION_COLUMNS: ColDef[] = [
  { field: 'displayName', headerName: 'Display Name', sort: 'asc' },
  { field: 'version', headerName: 'Version' },
];

export const SIMPLE_NAME_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'displayName', headerName: 'Display Name' },
  { field: 'version', headerName: 'Version' },
];

export const SIMPLE_ENTITY_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'description', headerName: 'Description' },
];

export const KEY_ENTITY_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  {
    field: 'createdAt',
    headerName: 'Creation time',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
    hide: true,
  },
  {
    field: 'keyGeneratedAt',
    headerName: 'Key generation time',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
    hide: false,
  },
  {
    field: 'expiresAt',
    headerName: 'Expiration time',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
    hide: false,
  },
  {
    headerName: 'Status',
    field: 'status',
    cellRenderer: KeyStatusCellRenderer,
    hide: false,
  },
  {
    headerName: 'Project',
    field: 'project',
    hide: true,
  },
  {
    headerName: 'Project contact point',
    field: 'projectContactPoint',
    hide: true,
  },
  {
    headerName: 'Secured',
    field: 'secured',
    hide: true,
  },
];

export const RUNNERS_COLUMNS: ColDef[] = [
  { field: 'dial:applicationTypeDisplayName', headerName: 'Display Name', sort: 'asc' },
  { field: '$id', headerName: 'ID' },
  { field: 'description', headerName: 'Description' },
  {
    field: 'topics',
    headerName: 'Topics',
    cellRenderer: TopicsCellRenderer,
    cellRendererParams: (params: { data?: DialBaseNamedEntity & { topics: string[] } }) => ({
      topics: params.data?.topics || [],
    }),
  },
];

export const PROMPTS_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'version', headerName: 'Version' },
  { field: 'author', headerName: 'Author' },
  {
    field: 'updateTime',
    headerName: 'Update time',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
  },
];

export const FILES_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'extension', headerName: 'Extension' },
  { field: 'author', headerName: 'Author' },
];

export const EXPORT_COLUMNS = (onChange: (value: string, name: string) => void, route?: ApplicationRoute): ColDef[] => [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  route === ApplicationRoute.Prompts
    ? {
        headerName: 'Version',
        field: 'version',
        sortable: true,
        filter: true,
        cellClass: NO_BORDER_CLASS,
        cellRenderer: SelectCellRenderer,
        cellRendererParams: {
          getItems: (data: DialPrompt) => data.versions?.map((v) => ({ id: v, name: v })),
          onChange,
          isMulti: true,
        },
      }
    : {
        headerName: 'Extension',
        field: 'extension',
      },
  { field: 'author', headerName: 'Author' },
  {
    field: 'updateTime',
    headerName: 'Update time',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
  },
];

export const PUBLICATION_COLUMNS: ColDef[] = [
  { field: 'requestName', headerName: 'Name' },
  { field: 'author', headerName: 'Author' },
  {
    field: 'createdAt',
    headerName: 'Created at',
    sort: 'asc',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
  },
];

export const ENTITY_BASE_COLUMNS: ColDef[] = [
  { field: 'displayName', headerName: 'Display Name', sort: 'asc', hide: false },
  { field: 'displayVersion', headerName: 'Version', hide: false },
  { field: 'description', headerName: 'Description', hide: false },
  { field: 'name', headerName: 'Deployment ID', hide: false },
];

export const ENTITY_WITH_VERSION_COLUMNS = (
  t: (stringToTranslate: string) => string,
  adapters: DialAdapter[] = [],
): ColDef[] => [
  ...ENTITY_BASE_COLUMNS,
  adapters.length
    ? {
        field: 'endpoint',
        headerName: 'Adapter',
        hide: false,
        valueFormatter: ({ data }) => getFormatterAdapter(data, adapters),
      }
    : { field: 'endpoint', headerName: 'Endpoint', hide: false },
  { field: 'type', headerName: 'Type', hide: true },
  { field: 'overrideName', headerName: 'Override Name', hide: true },
  {
    field: 'topics',
    headerName: 'Topics',
    hide: true,
    cellRenderer: TopicsCellRenderer,
    cellRendererParams: (params: { data?: DialBaseNamedEntity & { topics: string[] } }) => ({
      topics: params.data?.topics || [],
    }),
  },
  {
    field: 'inputAttachmentTypes',
    headerName: 'Attachment types',
    hide: true,
    valueFormatter: ({ value }) => formatAttachment(value, t),
    tooltipValueGetter: ({ value }) => formatAttachment(value, t),
  },
  { field: 'maxInputAttachments', headerName: 'Max attachment number', hide: true },
  { field: 'tokenizerModel', headerName: 'Tokenizer model', hide: true },
  { field: 'forwardAuthToken', headerName: 'Forward auth token', hide: true },
  { field: 'limits.maxTotalTokens', headerName: 'Interaction limit', hide: true },
  { field: 'pricing.prompt', headerName: 'Prompt price', hide: true },
  { field: 'pricing.completion', headerName: 'Completion price', hide: true },
];

export const ENTITIES_COLUMNS = <T>(
  columns: ColDef[],
  remove?: (entity: T) => void,
  duplicate?: (entity: T) => void,
  open?: (entity: T) => void,
  move?: (entity: T) => void,
): ColDef[] => {
  const actions = [];
  if (open) {
    actions.push(getOpenInNewTabOperation(open));
  }
  if (duplicate) {
    actions.push(getDuplicateOperation(duplicate));
  }
  if (move) {
    actions.push(getMoveOperation(move));
  }
  if (remove) {
    actions.push(getDeleteOperation(remove));
  }
  return [...columns, ACTION_COLUMN(actions)];
};

export const getPublicationColumns = (open: (publication: Publication) => void): ColDef[] => {
  const actions = [getOpenInNewTabOperation(open)];

  return [...PUBLICATION_COLUMNS, ACTION_COLUMN(actions)];
};

export const listViewTitleMap: Record<string, MenuI18nKey> = {
  [ApplicationRoute.Models]: MenuI18nKey.Models,
  [ApplicationRoute.Applications]: MenuI18nKey.Applications,
  [ApplicationRoute.Adapters]: MenuI18nKey.Adapters,
  [ApplicationRoute.Assistants]: MenuI18nKey.Assistants,
  [ApplicationRoute.Interceptors]: MenuI18nKey.Interceptors,
  [ApplicationRoute.Keys]: MenuI18nKey.Keys,
  [ApplicationRoute.Roles]: MenuI18nKey.Roles,
  [ApplicationRoute.ApplicationRunners]: MenuI18nKey.ApplicationRunners,
  [ApplicationRoute.Prompts]: MenuI18nKey.Prompts,
  [ApplicationRoute.Files]: MenuI18nKey.Files,
  [ApplicationRoute.Addons]: MenuI18nKey.Addons,
  [ApplicationRoute.Routes]: MenuI18nKey.Routes,
  [ApplicationRoute.PromptPublications]: MenuI18nKey.PromptPublications,
  [ApplicationRoute.FilePublications]: MenuI18nKey.FilePublications,
  [ApplicationRoute.ActivityAudit]: MenuI18nKey.ActivityAudit,
};

export const emptyDataTitleMap: Record<string, EntitiesI18nKey> = {
  [ApplicationRoute.Models]: EntitiesI18nKey.NoModels,
  [ApplicationRoute.Applications]: EntitiesI18nKey.NoApplications,
  [ApplicationRoute.ApplicationRunners]: EntitiesI18nKey.NoApplicationRunners,
  [ApplicationRoute.Assistants]: EntitiesI18nKey.NoAssistants,
  [ApplicationRoute.Interceptors]: EntitiesI18nKey.NoInterceptors,
  [ApplicationRoute.Adapters]: EntitiesI18nKey.NoAdapters,
  [ApplicationRoute.Keys]: EntitiesI18nKey.NoKeys,
  [ApplicationRoute.Roles]: EntitiesI18nKey.NoRoles,
  [ApplicationRoute.Addons]: EntitiesI18nKey.NoAddons,
  [ApplicationRoute.Routes]: EntitiesI18nKey.NoRoutes,
  [ApplicationRoute.Prompts]: EntitiesI18nKey.NoPrompts,
  [ApplicationRoute.Files]: EntitiesI18nKey.NoFiles,
  [ApplicationRoute.PromptPublications]: EntitiesI18nKey.NoPublications,
  [ApplicationRoute.FilePublications]: EntitiesI18nKey.NoPublications,
  [ApplicationRoute.ActivityAudit]: EntitiesI18nKey.NoActivityAudit,
};

export const deleteModalTitleMap: Record<string, DeleteI18nKey> = {
  [ApplicationRoute.Models]: DeleteI18nKey.Model,
  [ApplicationRoute.Applications]: DeleteI18nKey.Application,
  [ApplicationRoute.ApplicationRunners]: DeleteI18nKey.ApplicationRunnerTitle,
  [ApplicationRoute.Interceptors]: DeleteI18nKey.Interceptor,
  [ApplicationRoute.Keys]: DeleteI18nKey.Key,
  [ApplicationRoute.Roles]: DeleteI18nKey.Role,
  [ApplicationRoute.Addons]: DeleteI18nKey.Addons,
  [ApplicationRoute.Assistants]: DeleteI18nKey.Model,
  [ApplicationRoute.Prompts]: DeleteI18nKey.Prompt,
  [ApplicationRoute.Files]: DeleteI18nKey.File,
  [ApplicationRoute.Routes]: DeleteI18nKey.Route,
  [ApplicationRoute.Adapters]: DeleteI18nKey.AdapterTitle,
};

export const createModalTitleMap: Record<string, CreateI18nKey> = {
  [ApplicationRoute.Models]: CreateI18nKey.Model,
  [ApplicationRoute.Applications]: CreateI18nKey.Application,
  [ApplicationRoute.ApplicationRunners]: CreateI18nKey.ApplicationRunner,
  [ApplicationRoute.Keys]: CreateI18nKey.Key,
  [ApplicationRoute.Roles]: CreateI18nKey.Role,
  [ApplicationRoute.Interceptors]: CreateI18nKey.Interceptor,
  [ApplicationRoute.Addons]: CreateI18nKey.Addons,
  [ApplicationRoute.Assistants]: CreateI18nKey.Assistant,
  [ApplicationRoute.Prompts]: CreateI18nKey.Prompt,
  [ApplicationRoute.Routes]: CreateI18nKey.Route,
  [ApplicationRoute.Adapters]: CreateI18nKey.Adapter,
};

export const formatAttachment = (value: string, t: (stringToTranslate: string) => string) => {
  if (value && value?.[0] === ALL_ATTACHMENTS) {
    return t(AttachmentsI18nKey.AllAttachments);
  }
  return value;
};

export const getEntityPath = (route: ApplicationRoute, data: unknown, forRemove?: boolean) => {
  switch (route) {
    case ApplicationRoute.ApplicationRunners:
      return encodeURIComponent(`${(data as DialApplicationScheme).$id}`);

    case ApplicationRoute.Prompts:
    case ApplicationRoute.Files:
      return forRemove
        ? decodeURIComponent((data as DialPrompt).path)
        : `${encodeURIComponent((data as DialPrompt).name as string)}?path=${encodeURIComponent((data as DialPrompt).path)}`;

    case ApplicationRoute.PromptPublications:
    case ApplicationRoute.FilePublications:
      return `${encodeURIComponent((data as Publication).requestName)}?path=${(data as DialPrompt).path}`;

    case ApplicationRoute.ActivityAudit:
      return (data as DialActivity).activityId;

    default:
      return encodeURIComponent((data as DialBaseNamedEntity).name || '');
  }
};
