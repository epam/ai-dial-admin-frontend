import { ApplicationRoute } from '@/src/types/routes';

export type BaseAssetRoute =
  | ApplicationRoute.Prompts
  | ApplicationRoute.AssetsApplications
  | ApplicationRoute.AssetsToolsets;

export enum ModalType {
  create = 'create',
  export = 'export',
  import = 'import',
  delete = 'delete',
  duplicate = 'duplicate',
  move = 'move',
}
