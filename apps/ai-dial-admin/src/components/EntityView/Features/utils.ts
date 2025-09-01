import { ApplicationRoute } from '@/src/types/routes';
import { DialFeatures } from '@/src/models/dial/features';
import {
  applicationSwitchFeatures,
  applicationTextFeatures,
  modelsSwitchFeatures,
  modelsTextFeatures,
} from './constants';

export const getSwitchControls = (view: ApplicationRoute): (keyof DialFeatures)[] => {
  if (view === ApplicationRoute.Models) {
    return modelsSwitchFeatures;
  }

  if (view === ApplicationRoute.Applications) {
    return applicationSwitchFeatures;
  }

  return [];
};

export const getTextControls = (view: ApplicationRoute): (keyof DialFeatures)[] => {
  if (view === ApplicationRoute.Models) {
    return modelsTextFeatures;
  }

  if (view === ApplicationRoute.Applications) {
    return applicationTextFeatures;
  }

  return [];
};
