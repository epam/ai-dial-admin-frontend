import { MODELS_PREFIX } from '@/src/constants/publications-core';

/**
 * The identifier a caller invokes an asset model by. DIAL Core keys API-written entities in its merged
 * config by canonical id and sets each deployment's name from that key, so a model this UI lists as
 * `gpt-4` is addressed as `models/platform/gpt-4` — whereas a model defined in Core's static config
 * keeps its bare name. Both populations coexist in one map, so the two forms are not interchangeable.
 */
export const getModelDeploymentId = (name?: string): string => (name ? `${MODELS_PREFIX}${name}` : '');
