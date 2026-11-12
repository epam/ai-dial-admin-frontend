import { ComponentType, ReactNode } from 'react';

import { ColDef } from 'ag-grid-community';

import { MenuI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

export enum EntitySelectType {
  Skill = 'skill',
  File = 'file',
  Application = 'application',
}

/** Everything that differs between entity pickers: the folder tree it browses and how the reference is built. */
export interface EntitySelectConfig {
  /** Core resource prefix of the reference the picker emits (`<prefix><bucket>/<path>`). */
  prefix: string;
  route: ApplicationRoute;
  /** The root folders the picker's tree loads (with trailing slash). Most entity types have the single `public/` one. */
  rootFolders: string[];
  /** Label of the tree's virtual root; needed only when `rootFolders` has several, so no one bucket stands for it. */
  rootLabelI18nKey?: MenuI18nKey;
  headerI18nKey: TestSuitesI18nKey;
  portalId: string;
  /** Whether the reference can be typed into the input; a prefixed reference is only valid when picked from the tree. */
  isEditable: boolean;
  gridColumns: ColDef[];
  FolderProvider: ComponentType<{ children: ReactNode }>;
  useFolder: () => AssetsFolderContextReader;
}
