import { SOURCE_FIELD } from '@/src/components/SourceField/types';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ApplicationRoute } from '@/src/types/routes';
import { getSchemaSourceId } from '@/src/utils/entities/application-source';

/** The blank entity a platform create form starts from; `initialValues` seeds it (runner/container create). */
export const getInitialPlatformEntity = <T extends BaseEntity>(
  view: ApplicationRoute,
  initialValues?: Partial<T>,
): T => {
  switch (view) {
    case ApplicationRoute.PlatformModels:
    case ApplicationRoute.PlatformRouters:
    case ApplicationRoute.PlatformRoutes:
      return { name: '', description: '', userRoles: [], ...initialValues } as unknown as T;
    case ApplicationRoute.PlatformTranslators:
      return { name: '', ...initialValues } as unknown as T;
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets:
      return { name: '', description: '', user_roles: [], ...initialValues } as unknown as T;
    default:
      return { name: '', description: '', ...initialValues } as unknown as T;
  }
};

/**
 * Seeds for a platform create. An entity-style `source` (an app runner's schema) has no meaning on a platform
 * resource, which names its runner through `application_type_schema_id`, so it is translated and dropped.
 */
export const toPlatformInitialValues = <T extends object>(initialValues?: T): Partial<BaseEntity> | undefined => {
  if (!initialValues) {
    return undefined;
  }

  const { source, ...rest } = initialValues as T & { source?: SOURCE_FIELD };
  const schemaId = getSchemaSourceId(source);
  return (schemaId ? { ...rest, application_type_schema_id: schemaId } : rest) as Partial<BaseEntity>;
};
