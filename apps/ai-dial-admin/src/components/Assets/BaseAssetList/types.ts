import { ApplicationRoute } from '@/src/types/routes';

export type BaseAssetRoute =
  | ApplicationRoute.Prompts
  | ApplicationRoute.AssetsApplications
  | ApplicationRoute.AssetsToolsets
  | ApplicationRoute.Conversations;

export type CrudAssetRoute = Exclude<BaseAssetRoute, ApplicationRoute.Conversations>;

export enum ModalType {
  create = 'create',
  export = 'export',
  import = 'import',
  delete = 'delete',
  duplicate = 'duplicate',
  move = 'move',
}
