import { EntityType } from '@/src/types/entity-type';

export const getAllAvailableDependencies = (type?: EntityType): EntityType[] => {
  if (type === EntityType.ROLE) {
    return [
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.TOOLSET,
      EntityType.ROUTE,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ];
  }
  if (type === EntityType.KEY) {
    return [
      EntityType.ROLE,
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ];
  }

  if (type === EntityType.MODEL) {
    return [EntityType.INTERCEPTOR];
  }

  if (type === EntityType.APPLICATION) {
    return [EntityType.MODEL, EntityType.APPLICATION, EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR];
  }

  return [];
};
