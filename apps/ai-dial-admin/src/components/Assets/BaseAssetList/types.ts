import { ApplicationRoute } from '@/src/types/routes';

export type BaseAssetRoute =
  | ApplicationRoute.Prompts
  | ApplicationRoute.AssetsApplications
  | ApplicationRoute.AssetsToolsets
  | ApplicationRoute.Conversations
  | ApplicationRoute.PlatformModels
  | ApplicationRoute.PlatformAppRunners
  | ApplicationRoute.PlatformInterceptors
  | ApplicationRoute.PlatformRoutes
  | ApplicationRoute.PlatformRoles
  | ApplicationRoute.PlatformKeys
  | ApplicationRoute.Skills;

export type CrudAssetRoute =
  | ApplicationRoute.Prompts
  | ApplicationRoute.AssetsApplications
  | ApplicationRoute.AssetsToolsets;

export type CreateAssetRoute =
  | CrudAssetRoute
  | ApplicationRoute.PlatformModels
  | ApplicationRoute.PlatformAppRunners
  | ApplicationRoute.PlatformInterceptors
  | ApplicationRoute.PlatformRoutes
  | ApplicationRoute.PlatformRoles
  | ApplicationRoute.PlatformKeys;

export enum ModalType {
  create = 'create',
  export = 'export',
  import = 'import',
  delete = 'delete',
  duplicate = 'duplicate',
  move = 'move',
}
