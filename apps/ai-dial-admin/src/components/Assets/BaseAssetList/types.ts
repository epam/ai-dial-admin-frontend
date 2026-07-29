import { ApplicationRoute } from '@/src/types/routes';

export type BaseAssetRoute =
  | ApplicationRoute.Prompts
  | ApplicationRoute.AssetsApplications
  | ApplicationRoute.AssetsToolsets
  | ApplicationRoute.Conversations
  | ApplicationRoute.AssetsModels;

export type CrudAssetRoute =
  | ApplicationRoute.Prompts
  | ApplicationRoute.AssetsApplications
  | ApplicationRoute.AssetsToolsets;

export type CreateAssetRoute = CrudAssetRoute | ApplicationRoute.AssetsModels;

export enum ModalType {
  create = 'create',
  export = 'export',
  import = 'import',
  delete = 'delete',
  duplicate = 'duplicate',
  move = 'move',
}
