import { DialApplicationScheme } from '@/src/models/dial/application';

export enum AppRunnerOrigin {
  Config = 'config',
  Platform = 'platform',
}

export interface AppRunnerOption extends DialApplicationScheme {
  origin: AppRunnerOrigin;
  reference: string;
  path?: string;
  author?: string;
}
