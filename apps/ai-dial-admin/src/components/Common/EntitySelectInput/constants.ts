import { NAME_COLUMN } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';

import { FILES_GRID_COLUMNS } from '@/src/components/Assets/Artifacts/Files/constants';
import { AliasI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { APPLICATIONS_PREFIX, MODELS_PREFIX, SKILLS_PREFIX, TOOLSETS_PREFIX } from '@/src/constants/publications-core';
import { AppsFolderProvider, useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { FileFolderProvider, useFileFolder } from '@/src/context/assets/FileFolderContext';
import { ModelsFolderProvider, useModelsFolder } from '@/src/context/assets/ModelsFolderContext';
import { SkillFolderProvider, useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { ToolsetFolderProvider, useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitySelectConfig, EntitySelectType } from './models';

// Imported straight from the kit (as `FILES_GRID_COLUMNS` does) rather than via `getAssetNameColumn`: that
// module builds the per-view server-action maps at load time, which every importer of this picker would drag in.
const ENTITY_SELECT_GRID_COLUMNS: ColDef[] = [NAME_COLUMN('Name') as ColDef];

export const ENTITY_SELECT_CONFIGS: Record<EntitySelectType, EntitySelectConfig> = {
  [EntitySelectType.Skill]: {
    prefix: SKILLS_PREFIX,
    route: ApplicationRoute.Skills,
    headerI18nKey: TestSuitesI18nKey.SelectSkill,
    portalId: 'skillSelect',
    isEditable: false,
    gridColumns: ENTITY_SELECT_GRID_COLUMNS,
    FolderProvider: SkillFolderProvider,
    useFolder: useSkillFolder,
  },
  // A file path carries no resource prefix, so this entry is only used through the manager, not `EntitySelectInput`.
  [EntitySelectType.File]: {
    prefix: '',
    route: ApplicationRoute.Files,
    headerI18nKey: TestSuitesI18nKey.SelectDocument,
    portalId: 'fileSelect',
    isEditable: true,
    gridColumns: FILES_GRID_COLUMNS,
    FolderProvider: FileFolderProvider,
    useFolder: useFileFolder,
  },
  // Like `File`, only used through the manager: the role picks applications from every source they have.
  [EntitySelectType.Application]: {
    prefix: APPLICATIONS_PREFIX,
    route: ApplicationRoute.AssetsApplications,
    headerI18nKey: TestSuitesI18nKey.SelectApplications,
    portalId: 'applicationSelect',
    isEditable: false,
    gridColumns: ENTITY_SELECT_GRID_COLUMNS,
    FolderProvider: AppsFolderProvider,
    useFolder: useAppsFolder,
  },
  // Like `Application`, only used through the manager: an alias picks one toolset from every source it has.
  [EntitySelectType.Toolset]: {
    prefix: TOOLSETS_PREFIX,
    route: ApplicationRoute.AssetsToolsets,
    headerI18nKey: AliasI18nKey.SelectToolsetTarget,
    portalId: 'toolsetSelect',
    isEditable: false,
    gridColumns: ENTITY_SELECT_GRID_COLUMNS,
    FolderProvider: ToolsetFolderProvider,
    useFolder: useToolsetFolder,
  },
  // Models have no Public tree (a model is a config or platform deployment), so this picker is the Platform and
  // config.json grids only; its `FolderProvider` is never browsed as a tree.
  [EntitySelectType.Model]: {
    prefix: MODELS_PREFIX,
    route: ApplicationRoute.PlatformModels,
    headerI18nKey: AliasI18nKey.SelectModelTarget,
    portalId: 'modelSelect',
    isEditable: false,
    gridColumns: ENTITY_SELECT_GRID_COLUMNS,
    FolderProvider: ModelsFolderProvider,
    useFolder: useModelsFolder,
  },
};
