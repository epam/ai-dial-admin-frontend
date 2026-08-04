import { DialApplicationScheme } from '@/src/models/dial/application';

export enum AppRunnerOrigin {
  Entity = 'entity',
  Asset = 'asset',
}

export interface AppRunnerOption extends DialApplicationScheme {
  origin: AppRunnerOrigin;
  reference: string;
  path?: string;
  author?: string;
}
