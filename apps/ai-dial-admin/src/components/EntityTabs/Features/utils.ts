import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialFeatures } from '@/src/models/dial/features';
import { ApplicationRoute } from '@/src/types/routes';
import {
  applicationSwitchGroups,
  applicationTextFeatures,
  modelsSwitchGroups,
  modelsTextFeatures,
  runnerApplicationMap,
} from './constants';
import { SwitchFeatureGroup } from './models';

export const getSwitchGroups = (view: ApplicationRoute): SwitchFeatureGroup[] => {
  if (view === ApplicationRoute.Models) {
    return modelsSwitchGroups;
  }

  if (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) {
    return applicationSwitchGroups;
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
