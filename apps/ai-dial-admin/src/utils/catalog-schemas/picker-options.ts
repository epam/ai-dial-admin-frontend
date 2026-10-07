import { CatalogEntityType, CatalogSchemaOption } from '@/src/models/dial/catalog-schema';

/**
 * The catalog schemas a deployment's picker offers by default: those written for its own entity kind,
 * plus the two populations that must never be hidden.
 *
 * A schema survives when any of these holds:
 * - its declared kind matches `entityType` — the point of the filter;
 * - it declares no kind at all. Core's listing copies `dial:catalogEntityType` unconditionally, so a
 *   schema without one arrives as null, and hiding those would make a legal configuration
 *   unreachable;
 * - its `$id` is the one the deployment already points at, whatever kind it declares. Core never
 *   checks a deployment's kind against the schema's, so a cross-kind pairing is valid and the field
 *   must not deny a value it is currently showing.
 *
 * With no `entityType` the input is returned unchanged, so a surface that has not opted in behaves
 * as it did before the filter existed. Relaxing the filter entirely is the caller's job — the browse
 * modal's "show all" control simply does not call this.
 */
export const filterCatalogSchemaOptionsByEntityType = (
  options: CatalogSchemaOption[],
  entityType?: CatalogEntityType,
  selectedId?: string,
): CatalogSchemaOption[] => {
  if (!entityType) {
    return options;
  }

  return options.filter((option) => {
    const declared = option['dial:catalogEntityType'];
    return declared == null || declared === entityType || option.$id === selectedId;
  });
};
