// NIM Model Serving is no longer supported, so its activities stay in the backend but are never
// listed. The enum member is gone, hence the literal.
const HIDDEN_RESOURCE_TYPES = new Set<string>(['NimDeployment']);

export const isHiddenResourceType = (resourceType?: string): boolean =>
  resourceType != null && HIDDEN_RESOURCE_TYPES.has(resourceType);
