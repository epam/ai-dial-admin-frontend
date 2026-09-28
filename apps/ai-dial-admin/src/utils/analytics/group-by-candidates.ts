import { AnalyticsEntityField } from '@/src/models/analytics/entity';

const lastSegment = (name: string): string => name.slice(name.lastIndexOf('.') + 1);

/** A field the service supplies through an enrichment is namespaced by it, leaving its backing name bare. */
const isEnrichmentSourced = (field: AnalyticsEntityField): boolean => field.name !== field.source;

/**
 * What the service accepts as a group trigger's `group_by`, in the order it is worth offering.
 *
 * The value is not simply the target's grain key. The service takes the bare key **only** when the read
 * source declares it as a column of its own; where the source reaches the key through an enrichment, the
 * bare spelling projects nothing and is refused with the qualified name to write instead. So the choice is
 * between the bare key, when the source has it, and every `<enrichment>.<grain key>` the source reaches —
 * usually one or two names, and occasionally exactly one, which leaves nothing to choose.
 */
export const getGroupByCandidates = (fields: AnalyticsEntityField[], grainKey?: string): string[] => {
  if (!grainKey) return [];

  const hasBare = fields.some((field) => field.name === grainKey && !isEnrichmentSourced(field));

  const qualified = fields
    .filter((field) => isEnrichmentSourced(field) && lastSegment(field.name) === grainKey)
    .map((field) => field.name);

  return hasBare ? [grainKey, ...qualified] : qualified;
};
