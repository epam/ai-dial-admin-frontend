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
