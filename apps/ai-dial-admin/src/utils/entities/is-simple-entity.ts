import { ApplicationRoute } from '@/src/types/routes';

export const isSimpleEntity = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Applications:
    case ApplicationRoute.Models:
    case ApplicationRoute.Addons:
    case ApplicationRoute.Assistants:
      return false;

    default:
      return true;
  }
};
