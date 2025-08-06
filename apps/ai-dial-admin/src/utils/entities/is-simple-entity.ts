import { ApplicationRoute } from '@/src/types/routes';

export const isSimpleEntity = (view: ApplicationRoute) => {
  switch (view) {
    case ApplicationRoute.Applications:
    case ApplicationRoute.Models:
      return false;

    default:
      return true;
  }
};
