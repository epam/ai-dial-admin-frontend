import { NAME_COLUMN } from '@epam/ai-dial-react-file-manager';
import { ColDef } from 'ag-grid-community';

import { FILES_GRID_COLUMNS } from '@/src/components/Assets/Artifacts/Files/constants';
import { ROOT_FOLDER } from '@/src/constants/file';
import { MenuI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { APPLICATIONS_PREFIX, SKILLS_PREFIX } from '@/src/constants/publications-core';
import { AppsFolderProvider, useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { FileFolderProvider, useFileFolder } from '@/src/context/assets/FileFolderContext';
import { SkillFolderProvider, useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { ApplicationRoute } from '@/src/types/routes';
import { getRootFolders } from '@/src/utils/files/root-folder';
import { EntitySelectConfig, EntitySelectType } from './models';

// Imported straight from the kit (as `FILES_GRID_COLUMNS` does) rather than via `getAssetNameColumn`: that
// module builds the per-view server-action maps at load time, which every importer of this picker would drag in.
const ENTITY_SELECT_GRID_COLUMNS: ColDef[] = [NAME_COLUMN('Name') as ColDef];

export const ENTITY_SELECT_CONFIGS: Record<EntitySelectType, EntitySelectConfig> = {
  [EntitySelectType.Skill]: {
    prefix: SKILLS_PREFIX,
    route: ApplicationRoute.Skills,
    rootFolders: [`${ROOT_FOLDER}/`],
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
    rootFolders: [`${ROOT_FOLDER}/`],
    headerI18nKey: TestSuitesI18nKey.SelectDocument,
    portalId: 'fileSelect',
    isEditable: true,
    gridColumns: FILES_GRID_COLUMNS,
    FolderProvider: FileFolderProvider,
    useFolder: useFileFolder,
  },
  // Like `File`, only used through the manager: the role picks applications from every root their tree has.
  [EntitySelectType.Application]: {
    prefix: APPLICATIONS_PREFIX,
    route: ApplicationRoute.AssetsApplications,
    rootFolders: getRootFolders(ApplicationRoute.AssetsApplications).map((root) => `${root}/`),
    rootLabelI18nKey: MenuI18nKey.Applications,
    headerI18nKey: TestSuitesI18nKey.SelectApplications,
    portalId: 'applicationSelect',
    isEditable: false,
    gridColumns: ENTITY_SELECT_GRID_COLUMNS,
    FolderProvider: AppsFolderProvider,
    useFolder: useAppsFolder,
  },
};
