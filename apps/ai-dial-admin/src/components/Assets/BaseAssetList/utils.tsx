import { MouseEvent } from 'react';
import { FileManagerColumnKey, NAME_COLUMN, SelectOption, UPDATED_AT_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import SelectCellRenderer, { SelectCellRendererParams } from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { STRINGS_DELIMITER } from '@/src/constants/prompt';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { ToolsetTransport } from '@/src/types/toolset';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import {
  bulkDeleteApps,
  createApp,
  exportApps,
  getApp,
  importApps,
  moveApps,
} from '@/src/app/[lang]/assets-applications/actions';
import {
  bulkDeletePrompts,
  createPrompt,
  exportPrompts,
  getPrompt,
  movePrompts,
} from '@/src/app/[lang]/prompts/actions';
import {
  bulkDeleteToolsets,
  createToolset,
  exportToolsets,
  getToolset,
  importToolsets,
  moveToolsets,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { ResourceType } from '@/src/types/resource-type';
import { ImportFileType } from '@/src/types/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { importPrompts } from '@/src/utils/prompts/import-prompts';
import { compareVersions, getNameVersionFromAsset } from '@/src/utils/entities/versions';
import MultiSelectTagsRenderer from '../../Grid/CellRenderers/MultiSelectTagsRenderer';
import { TEMP_FOLDER } from '@/src/constants/file';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import { deleteConversations, getConversation } from '@/src/app/[lang]/conversations/actions';
import { CrudAssetRoute } from './types';

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
  onChange: (
    value: string | string[],
    data: unknown,
    column?: string | undefined,
    index?: number | undefined,
    isSelected?: boolean | undefined,
  ) => void,
  selectedVersionsMap: Record<string, string[]>,
  hasSelectedItems: boolean,
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
    nodeType: DialFileNodeType.ITEM,
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
    default:
      return { title: '', description: '' };
  }
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
};

export const GetAssetActionMap = {
  [ApplicationRoute.Prompts]: getPrompt,
  [ApplicationRoute.AssetsApplications]: getApp,
  [ApplicationRoute.AssetsToolsets]: getToolset,
  [ApplicationRoute.Conversations]: getConversation,
};

export const CreateAssetActionMap: Record<
  CrudAssetRoute,
  (asset: AssetWithVersion) => Promise<ServerActionResponse<Record<string, unknown>>>
> = {
  [ApplicationRoute.Prompts]: createPrompt,
  [ApplicationRoute.AssetsApplications]: createApp as (
    asset: AssetWithVersion,
  ) => Promise<ServerActionResponse<Record<string, unknown>>>,
  [ApplicationRoute.AssetsToolsets]: createToolset as (
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
};

export const enrichConversationWithVersion = (conversation: AssetWithVersion): AssetWithVersion => {
  const fullName = conversation.path.split('/').pop() || '';
  const { name, version } = getNameVersionFromAsset(fullName);

  return { ...conversation, name, version };
};
