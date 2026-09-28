import { JsonSchema } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

/**
 * Declarative only: DIAL Core validates a deployment's `catalog_properties` against the schema its
 * `catalog_schema_id` names, and never checks the deployment's own kind against this value.
 */
export enum CatalogEntityType {
  Model = 'model',
  Agent = 'agent',
  Toolset = 'toolset',
  Skill = 'skill',
  Interceptor = 'interceptor',
}

/** Values Core's catalog meta-schema allows in a property's `dial:meta`.`dial:widget`. */
export enum CatalogPropertyWidget {
  Text = 'text',
  RichText = 'richText',
  Badge = 'badge',
  Chips = 'chips',
  Url = 'url',
  Boolean = 'boolean',
  Image = 'image',
  Date = 'date',
}

/**
 * One entry of `GET /v1/catalog_schemas/schemas`. Core builds it from the merged configuration, so
 * both populations appear at once and no resource metadata (author, timestamps) is available. It
 * skips a schema declaring no `$id` or no `dial:catalogDisplayName`, but copies
 * `dial:catalogEntityType` unconditionally — a schema without one arrives with a null.
 */
export interface CatalogSchemaOption {
  $id: string;
  ['dial:catalogEntityType']?: CatalogEntityType | null;
  ['dial:catalogDisplayName']: string;
}

/**
 * A catalog schema as `GET /v1/catalog_schemas/schema?id=` returns it: the stored body alone,
 * resolved against the merged configuration. Distinct from `DialCatalogSchemaResource`, which is the
 * same body plus the bucket-resource fields (`name`, `path`, `folderId`) only the API-written
 * population has.
 */
export interface CatalogSchemaDocument {
  $id?: string;
  $defs?: JsonSchema['$defs'];
  ['dial:catalogEntityType']?: CatalogEntityType;
  ['dial:catalogDisplayName']?: string;
  ['dial:defaultLocale']?: string;
  properties?: JSONSchema7['properties'];
  required?: string[];
}
