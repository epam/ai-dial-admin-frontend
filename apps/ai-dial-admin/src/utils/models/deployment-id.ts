/**
 * The identifier a caller invokes an asset model by. DIAL Core keys API-written models in its merged
 * config by their bare short name and sets each deployment's name from that key, so a model this UI
 * lists as `gpt-4` is addressed as `gpt-4` — the same value from both the API-written and config-file
 * populations, which now share one map key.
 */
export const getModelDeploymentId = (name?: string): string => (name ? name : '');
