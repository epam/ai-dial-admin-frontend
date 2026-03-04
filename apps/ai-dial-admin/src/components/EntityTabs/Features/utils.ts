import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialFeatures } from '@/src/models/dial/features';
import { ApplicationRoute } from '@/src/types/routes';
import {
  applicationSwitchFeatures,
  applicationTextFeatures,
  modelsSwitchFeatures,
  modelsTextFeatures,
  runnerApplicationMap,
} from './constants';

export const getSwitchControls = (view: ApplicationRoute): (keyof DialFeatures)[] => {
  if (view === ApplicationRoute.Models) {
    return modelsSwitchFeatures;
  }

  if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
    return applicationSwitchFeatures;
  }

  return [];
};

export const getTextControls = (view: ApplicationRoute): (keyof DialFeatures)[] => {
  if (view === ApplicationRoute.Models) {
    return modelsTextFeatures;
  }

  if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
    return applicationTextFeatures;
  }

  return [];
};

export const getReadOnlyValues = (
  key: string,
  appRunner?: DialApplicationScheme,
): { value: string; isReadonly: boolean } => {
  const appRunnerKey = runnerApplicationMap[key];
  const appRunnerValue = appRunner?.[appRunnerKey as keyof DialApplicationScheme];
  const isReadonly = !!appRunner && !!appRunnerKey;
  return {
    value: appRunnerValue as string,
    isReadonly,
  };
};
