import { ComponentType, ReactNode } from 'react';

import { ColDef } from 'ag-grid-community';

import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { ApplicationRoute } from '@/src/types/routes';

export enum EntitySelectType {
  Skill = 'skill',
  File = 'file',
}

/** Everything that differs between entity pickers: the folder tree it browses and how the reference is built. */
export interface EntitySelectConfig {
  /** Core resource prefix of the reference the picker emits (`<prefix><bucket>/<path>`). */
  prefix: string;
  route: ApplicationRoute;
  headerI18nKey: string;
  portalId: string;
  gridColumns: ColDef[];
  FolderProvider: ComponentType<{ children: ReactNode }>;
  useFolder: () => AssetsFolderContextReader;
}
