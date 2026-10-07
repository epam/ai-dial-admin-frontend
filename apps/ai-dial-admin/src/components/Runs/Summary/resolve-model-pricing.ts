import { getModel as getEntityModel } from '@/src/app/[lang]/models/actions';
import { getModel as getPlatformModel } from '@/src/app/[lang]/platform-models/actions';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { DialModelPricing } from '@/src/models/dial/model';
import { getModelNavigationName } from '@/src/utils/resolve-model-deployment-route';

export interface ModelPricingResolution {
  /** True once the model resource itself was actually fetched, from either surface. */
  isResolved: boolean;
  /** The fetched resource's pricing; absent is a real "no price set" fact only when `isResolved`. */
  pricing: DialModelPricing | undefined;
}

const UNRESOLVED: ModelPricingResolution = { isResolved: false, pricing: undefined };

/**
 * Resolves a model deployment's pricing, probing the same two surfaces in the same order
 * `resolveModelDeploymentRoute` uses to pick a link target for it: Catalog (platform) models first,
 * falling back to Entities models on a miss. Both responses already carry `pricing` as part of the
 * full resource, so this costs no more than the routing probe the Summary tab already makes for this
 * id elsewhere (`use-deployment-type.ts`).
 *
 * `isResolved: false` means the model resource itself couldn't be found or fetched on either
 * surface — a transient error, a deleted model, or a stale id — and is deliberately distinct from
 * "fetched the resource and its `pricing` is absent". Only the latter is a confirmed "no price"
 * verdict; the former is just unknown, and callers must not read it as either a yes or a no.
 */
export async function resolveModelPricing(deploymentId: string): Promise<ModelPricingResolution> {
  const name = getModelNavigationName(deploymentId);

  try {
    const platformResult = await getPlatformModel(name, DEFAULT_ETAG);
    if (platformResult?.response) {
      return { isResolved: true, pricing: platformResult.response.pricing };
    }
  } catch {
    // Platform miss (thrown or unsuccessful) — fall back to Entities Models.
  }

  try {
    const entityResult = await getEntityModel(name, DEFAULT_ETAG);
    if (entityResult?.response) {
      return { isResolved: true, pricing: entityResult.response.pricing };
    }
  } catch {
    // Entities miss too — fall through to the unresolved result below.
  }

  return UNRESOLVED;
}
