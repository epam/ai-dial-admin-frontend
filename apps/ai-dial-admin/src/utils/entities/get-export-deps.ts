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
    return [EntityType.ADAPTER, EntityType.INTERCEPTOR];
  }

  if (type === EntityType.APPLICATION) {
    return [EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR];
  }

  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    return [EntityType.INTERCEPTOR];
  }

  return [];
};
