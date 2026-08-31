import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { EntityViewTab } from '@/src/utils/tabs/utils';

export interface AppRunnerAssetChangeHandler {
  (runner: DialAppRunnerResource, isSkipRefresh?: boolean): void;
}

export interface AppRunnerAssetProps {
  runner: DialAppRunnerResource;
  onChange: AppRunnerAssetChangeHandler;
}

export interface AppRunnerAssetTabsProps extends AppRunnerAssetProps {
  activeTab: EntityViewTab;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  globalInterceptors: string[];
  isSkipRefresh?: boolean;
}
