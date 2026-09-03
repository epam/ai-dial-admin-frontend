import {
  bulkDeleteApps,
  bulkDeletePlatformApplications,
  createApp,
  createPlatformApplication,
  exportApps,
  getApp,
  getPlatformApplication,
  importApps,
  moveApps,
} from '@/src/app/[lang]/assets-applications/actions';
import { bulkDeleteRunners, createRunner, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';
import {
  bulkDeleteInterceptors,
  createInterceptor,
  getInterceptor,
} from '@/src/app/[lang]/platform-interceptors/actions';
import { bulkDeleteModels, createModel, getModel } from '@/src/app/[lang]/platform-models/actions';
import { bulkDeleteKeys, createKey, getKey } from '@/src/app/[lang]/platform-keys/actions';
import { bulkDeleteRoles, createRole, getRole } from '@/src/app/[lang]/platform-roles/actions';
import { bulkDeleteRoutes, createRoute, getRoute } from '@/src/app/[lang]/platform-routes/actions';
import { bulkDeleteSkills, getSkill } from '@/src/app/[lang]/skills/actions';
import {
  bulkDeletePlatformToolsets,
  bulkDeleteToolsets,
  createPlatformToolset,
  createToolset,
  exportToolsets,
  getPlatformToolset,
  getToolset,
  importToolsets,
  moveToolsets,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { deleteConversations, getConversation } from '@/src/app/[lang]/conversations/actions';
import {
  bulkDeletePrompts,
  createPrompt,
  exportPrompts,
  getPrompt,
  movePrompts,
} from '@/src/app/[lang]/prompts/actions';
import SelectCellRenderer, { SelectCellRendererParams } from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { TEMP_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import { useAppRunnersFolder } from '@/src/context/assets/AppRunnersFolderContext';
import { useInterceptorsFolder } from '@/src/context/assets/InterceptorsFolderContext';
import { useKeysFolder } from '@/src/context/assets/KeysFolderContext';
import { useRolesFolder } from '@/src/context/assets/RolesFolderContext';
import { useRoutesFolder } from '@/src/context/assets/RoutesFolderContext';
import { useModelsFolder } from '@/src/context/assets/ModelsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialAppRunnerResource, DialModelResource, PlatformAsset } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { isFlatPlatformView, isPlatformDualBucketView } from '@/src/utils/files/root-folder';
import { ApplicationRoute } from '@/src/types/routes';
import { ToolsetTransport } from '@/src/types/toolset';
import { compareVersions, getNameVersionFromAsset } from '@/src/utils/entities/versions';
import { importPrompts } from '@/src/utils/prompts/import-prompts';
import { FileManagerColumnKey, NAME_COLUMN, SelectOption, UPDATED_AT_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { MouseEvent } from 'react';
import MultiSelectTagsRenderer from '../../Grid/CellRenderers/MultiSelectTagsRenderer';
import { CreateAssetRoute, CrudAssetRoute } from './types';

export const getItems = (data: unknown) => {
  const asset = data as AssetWithVersion;
  return asset?.versions
    ?.slice()
    .sort((a, b) => compareVersions(a, b))
    .map((v) => ({ value: v, label: v })) as SelectOption[];
};

export const customMultiSelectTagsRenderer = (
  options: SelectOption[],
  selectedValues: string[],
  handleRemoveTag: (event: MouseEvent<HTMLButtonElement>, val: string) => void,
) => {
  return <MultiSelectTagsRenderer items={selectedValues} options={options} handleRemoveTag={handleRemoveTag} />;
};

export const getGridColumns = (
  view: ApplicationRoute,
  onChange: (
    value: string | string[],
    data: unknown,
    column?: string | undefined,
    index?: number | undefined,
    isSelected?: boolean | undefined,
  ) => void,
  selectedVersionsMap: Record<string, string[]>,
  hasSelectedItems: boolean,
  currentPath?: string,
) => {
  const AUTHOR_COLUMN = {
    colId: FileManagerColumnKey.Author,
    field: 'author',
    headerName: 'Author',
    width: 200,
    suppressSizeToFit: true,
  };

  const VERSION_COLUMN = {
    colId: FileManagerColumnKey.Version,
    field: 'version',
    headerName: 'Version',
    width: 200,
    suppressSizeToFit: true,
    cellRenderer: (params: SelectCellRendererParams & { data: AssetWithVersion }) => {
      if (params.data?.versions) {
        const customSelectedVersions = selectedVersionsMap?.[`${params.data.folderId}${params.data.name}`];
        const selectValue = customSelectedVersions
          ? customSelectedVersions.join(STRINGS_DELIMITER)
          : params.data.selectedVersions.join(STRINGS_DELIMITER);
        return hasSelectedItems ? (
          <SelectCellRenderer
            {...params}
            data={params.data}
            value={selectValue}
            isMulti
            getItems={getItems}
            onChange={onChange}
            customMultiSelectTagsRenderer={customMultiSelectTagsRenderer}
          />
        ) : (
          params.data?.version || ''
        );
      } else {
        return null;
      }
    },
  };

  // Derived from the ui-kit's updated-time column so `createdAt` gets the same epoch-millis cell
  // renderer and locale params. `colId` must be overridden too — the factory hardcodes it, and two
  // columns sharing a `colId` collide in ag-grid.
  const CREATED_AT_COLUMN = (
    dateLocale: Intl.LocalesArgument,
    dateOptions: Intl.DateTimeFormatOptions | undefined,
  ): ColDef => ({
    ...(UPDATED_AT_COLUMN('Created time')(dateLocale, dateOptions) as ColDef),
    colId: 'createdAt',
    field: 'createdAt',
  });

  // Flat platform-bucket views share a metadata-only column set. Only the identity label differs: an
  // app runner's row name is its `$id`, a model's is its plain name. Skills shares the same
  // metadata-only shape (no Version column — a skill's folder listing carries no version info) even
  // though it isn't a flat platform view: it nests in folders like Toolsets, just without content to
  // read a display name from.
  if (isFlatPlatformView(view) || view === ApplicationRoute.Skills || isPlatformDualBucketView(view, currentPath)) {
    return [
      NAME_COLUMN(view === ApplicationRoute.PlatformAppRunners ? 'ID' : 'Name') as ColDef,
      AUTHOR_COLUMN,
      CREATED_AT_COLUMN as unknown as ColDef,
      UPDATED_AT_COLUMN('Updated time') as ColDef,
    ];
  }

  return [NAME_COLUMN('Name') as ColDef, VERSION_COLUMN, AUTHOR_COLUMN, UPDATED_AT_COLUMN('Updated time') as ColDef];
};

export const getAllSelectedItemsPaths = (basePath: string, selectedVersions: Record<string, string[]>): string[] => {
  const prefix = basePath.substring(0, basePath.lastIndexOf('__'));
  const versions = selectedVersions?.[prefix];

  return versions ? versions.map((v) => `${prefix}__${v}`) : [basePath];
};

export const getEmptyAsset = (view: ApplicationRoute, path: string): AssetWithVersion => {
  const baseEmptyAsset = {
    name: TEMP_FOLDER,
    folderId: path,
    version: '',
    path: `${path}${TEMP_FOLDER}`,
  };

  switch (view) {
    case ApplicationRoute.Prompts:
      return { ...baseEmptyAsset, content: '' };
    case ApplicationRoute.AssetsApplications:
      return { ...baseEmptyAsset, endpoint: '' };
    case ApplicationRoute.AssetsToolsets:
      return {
        ...baseEmptyAsset,
        endpoint: 'http://mock',
        displayName: TEMP_FOLDER,
        transport: ToolsetTransport.HTTP.toUpperCase() as ToolsetTransport,
      };
    default:
      return baseEmptyAsset;
  }
};

export const getFileManagerLabel = (view: ApplicationRoute): string => {
  switch (view) {
    case ApplicationRoute.Prompts:
      return FileManagerI18nKey.Prompts;
    case ApplicationRoute.AssetsApplications:
      return FileManagerI18nKey.Applications;
    case ApplicationRoute.AssetsToolsets:
      return FileManagerI18nKey.Toolsets;
    case ApplicationRoute.Conversations:
      return FileManagerI18nKey.Conversations;
    case ApplicationRoute.PlatformModels:
      return FileManagerI18nKey.Models;
    case ApplicationRoute.PlatformAppRunners:
      return FileManagerI18nKey.AppRunners;
    case ApplicationRoute.PlatformInterceptors:
      return FileManagerI18nKey.Interceptors;
    case ApplicationRoute.PlatformRoutes:
      return FileManagerI18nKey.Routes;
    case ApplicationRoute.PlatformRoles:
      return FileManagerI18nKey.Roles;
    case ApplicationRoute.PlatformKeys:
      return FileManagerI18nKey.Keys;
    case ApplicationRoute.Skills:
      return FileManagerI18nKey.Skills;
    default:
      return '';
  }
};

export const getEmptyStateContent = (
  view: ApplicationRoute,
  t: (key: string) => string,
): { title: string; description: string } => {
  switch (view) {
    case ApplicationRoute.Prompts:
      return {
        title: t(FileManagerI18nKey.PromptEmptyStateTitle),
        description: t(FileManagerI18nKey.PromptEmptyStateDescription),
      };
    case ApplicationRoute.AssetsApplications:
      return {
        title: t(FileManagerI18nKey.ApplicationsEmptyStateTitle),
        description: t(FileManagerI18nKey.ApplicationsEmptyStateDescription),
      };
    case ApplicationRoute.AssetsToolsets:
      return {
        title: t(FileManagerI18nKey.ToolsetsEmptyStateTitle),
        description: t(FileManagerI18nKey.ToolsetsEmptyStateDescription),
      };
    case ApplicationRoute.Conversations:
      return {
        title: t(FileManagerI18nKey.ConversationsEmptyStateTitle),
        description: '',
      };
    case ApplicationRoute.PlatformModels:
      return {
        title: t(FileManagerI18nKey.ModelsEmptyStateTitle),
        description: t(FileManagerI18nKey.ModelsEmptyStateDescription),
      };
    case ApplicationRoute.PlatformAppRunners:
      return {
        title: t(FileManagerI18nKey.AppRunnersEmptyStateTitle),
        description: t(FileManagerI18nKey.AppRunnersEmptyStateDescription),
      };
    case ApplicationRoute.PlatformInterceptors:
      return {
        title: t(FileManagerI18nKey.InterceptorsEmptyStateTitle),
        description: t(FileManagerI18nKey.InterceptorsEmptyStateDescription),
      };
    case ApplicationRoute.PlatformRoutes:
      return {
        title: t(FileManagerI18nKey.RoutesEmptyStateTitle),
        description: t(FileManagerI18nKey.RoutesEmptyStateDescription),
      };
    case ApplicationRoute.PlatformRoles:
      return {
        title: t(FileManagerI18nKey.RolesEmptyStateTitle),
        description: t(FileManagerI18nKey.RolesEmptyStateDescription),
      };
    case ApplicationRoute.PlatformKeys:
      return {
        title: t(FileManagerI18nKey.KeysEmptyStateTitle),
        description: t(FileManagerI18nKey.KeysEmptyStateDescription),
      };
    case ApplicationRoute.Skills:
      return {
        title: t(FileManagerI18nKey.SkillsEmptyStateTitle),
        description: t(FileManagerI18nKey.SkillsEmptyStateDescription),
      };
    default:
      return { title: '', description: '' };
  }
};

export const getPlatformAssetDuplicate = (view: ApplicationRoute, asset: PlatformAsset): PlatformAsset => {
  const {
    path: __path,
    folderId: __folderId,
    author: __author,
    createdAt: __createdAt,
    updatedAt: __updatedAt,
    status: __status,
    validationWarnings: __validationWarnings,
    reference: __reference,
    name,
    ...duplicate
  } = asset as DialModelResource & DialAppRunnerResource;

  return view === ApplicationRoute.PlatformAppRunners
    ? (duplicate as PlatformAsset)
    : ({ ...duplicate, name } as PlatformAsset);
};

export const getResourceTypeByRoute = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Prompts:
      return ResourceType.PROMPT;
    case ApplicationRoute.AssetsApplications:
      return ResourceType.APPLICATION;
    case ApplicationRoute.AssetsToolsets:
      return ResourceType.TOOLSET;
    case ApplicationRoute.Conversations:
      return ResourceType.CONVERSATION;
    default:
      return null;
  }
};

export const AssetFolderContextMap = {
  [ApplicationRoute.Prompts]: usePromptFolder,
  [ApplicationRoute.AssetsApplications]: useAppsFolder,
  [ApplicationRoute.AssetsToolsets]: useToolsetFolder,
  [ApplicationRoute.Conversations]: useConversationFolder,
  [ApplicationRoute.PlatformModels]: useModelsFolder,
  [ApplicationRoute.PlatformAppRunners]: useAppRunnersFolder,
  [ApplicationRoute.PlatformInterceptors]: useInterceptorsFolder,
  [ApplicationRoute.PlatformRoutes]: useRoutesFolder,
  [ApplicationRoute.PlatformRoles]: useRolesFolder,
  [ApplicationRoute.PlatformKeys]: useKeysFolder,
  [ApplicationRoute.Skills]: useSkillFolder,
};

export const GetAssetActionMap = {
  [ApplicationRoute.Prompts]: getPrompt,
  [ApplicationRoute.AssetsApplications]: getApp,
  [ApplicationRoute.AssetsToolsets]: getToolset,
  [ApplicationRoute.Conversations]: getConversation,
  [ApplicationRoute.PlatformModels]: getModel,
  [ApplicationRoute.PlatformAppRunners]: getRunner,
  [ApplicationRoute.PlatformInterceptors]: getInterceptor,
  [ApplicationRoute.PlatformRoutes]: getRoute,
  [ApplicationRoute.PlatformRoles]: getRole,
  [ApplicationRoute.PlatformKeys]: getKey,
  [ApplicationRoute.Skills]: getSkill,
};

/**
 * Applications and Toolsets are the only views whose "get"/"create"/"bulk-delete" call depends on
 * which bucket the target belongs to, not just on the view (design.md D2/`platform-applications`/
 * `platform-toolsets`). Callers resolve this map by view for a target in the `platform` bucket,
 * falling back to `GetAssetActionMap`/`CreateAssetActionMap`/`BulkDeleteAssetActionMap` otherwise.
 */
export const PlatformGetAssetActionMap: Partial<
  Record<ApplicationRoute, (path: string, etag: string) => ReturnType<typeof getPlatformApplication>>
> = {
  [ApplicationRoute.AssetsApplications]: getPlatformApplication,
  [ApplicationRoute.AssetsToolsets]: getPlatformToolset,
};

export const CreateAssetActionMap: Record<
  CreateAssetRoute,
  (asset: AssetWithVersion) => Promise<ServerActionResponse<Record<string, unknown>>>
> = {
  [ApplicationRoute.Prompts]: createPrompt,
  [ApplicationRoute.AssetsApplications]: createApp as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.AssetsToolsets]: createToolset as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.PlatformModels]: createModel as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.PlatformAppRunners]: createRunner as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.PlatformInterceptors]: createInterceptor as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.PlatformRoutes]: createRoute as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.PlatformRoles]: createRole as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.PlatformKeys]: createKey as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
};

export const PlatformCreateAssetActionMap: Partial<
  Record<ApplicationRoute, (asset: AssetWithVersion) => Promise<ServerActionResponse<Record<string, unknown>>>>
> = {
  [ApplicationRoute.AssetsApplications]: createPlatformApplication as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.AssetsToolsets]: createPlatformToolset as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
};

export const MoveAssetActionMap: Record<
  CrudAssetRoute,
  (
    paths: string[],
    newPath: string,
    overwrite?: boolean,
    duplicateName?: string,
  ) => Promise<ServerActionResponse<Record<string, unknown>>[]>
> = {
  [ApplicationRoute.Prompts]: movePrompts,
  [ApplicationRoute.AssetsApplications]: moveApps,
  [ApplicationRoute.AssetsToolsets]: moveToolsets,
};

export const ImportAssetActionMap: Record<
  CrudAssetRoute,
  (body: FormData, fileType: ImportFileType) => Promise<ServerActionResponse<Record<string, unknown>>>
> = {
  [ApplicationRoute.Prompts]: importPrompts,
  [ApplicationRoute.AssetsApplications]: importApps,
  [ApplicationRoute.AssetsToolsets]: importToolsets,
};

export const ExportAssetActionMap: Record<
  CrudAssetRoute,
  (paths: string[], type?: ImportFileType) => Promise<unknown>
> = {
  [ApplicationRoute.Prompts]: exportPrompts,
  [ApplicationRoute.AssetsApplications]: exportApps,
  [ApplicationRoute.AssetsToolsets]: exportToolsets,
};

export const BulkDeleteAssetActionMap = {
  [ApplicationRoute.Prompts]: bulkDeletePrompts,
  [ApplicationRoute.AssetsApplications]: bulkDeleteApps,
  [ApplicationRoute.AssetsToolsets]: bulkDeleteToolsets,
  [ApplicationRoute.Conversations]: deleteConversations,
  [ApplicationRoute.PlatformModels]: bulkDeleteModels,
  [ApplicationRoute.PlatformAppRunners]: bulkDeleteRunners,
  [ApplicationRoute.PlatformInterceptors]: bulkDeleteInterceptors,
  [ApplicationRoute.PlatformRoutes]: bulkDeleteRoutes,
  [ApplicationRoute.PlatformRoles]: bulkDeleteRoles,
  [ApplicationRoute.PlatformKeys]: bulkDeleteKeys,
  [ApplicationRoute.Skills]: bulkDeleteSkills,
};

export const PlatformBulkDeleteAssetActionMap: Partial<
  Record<ApplicationRoute, (paths: { path: string }[]) => Promise<ServerActionResponse<Record<string, unknown>>>>
> = {
  [ApplicationRoute.AssetsApplications]: bulkDeletePlatformApplications,
  [ApplicationRoute.AssetsToolsets]: bulkDeletePlatformToolsets,
};

export const enrichConversationWithVersion = (conversation: AssetWithVersion): AssetWithVersion => {
  const fullName = conversation.path.split('/').pop() || '';
  const { name, version } = getNameVersionFromAsset(fullName);

  return { ...conversation, name, version };
};
