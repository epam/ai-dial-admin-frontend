import { ComponentType, ReactNode } from 'react';

import { ColDef } from 'ag-grid-community';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { AssetSource } from '@/src/models/dial/asset-source';
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
  headerI18nKey: TestSuitesI18nKey;
  portalId: string;
  /** Whether the reference can be typed into the input; a prefixed reference is only valid when picked from the tree. */
  isEditable: boolean;
  gridColumns: ColDef[];
  FolderProvider: ComponentType<{ children: ReactNode }>;
  useFolder: () => AssetsFolderContextReader;
}

/** An entity chosen in the picker, with the source it came from; `path` is set for a Public tree entity only. */
export interface PickedEntity {
  source: AssetSource;
  name: string;
  path?: string;
}
