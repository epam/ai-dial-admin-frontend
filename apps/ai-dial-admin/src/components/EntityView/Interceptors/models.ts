import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialInterceptorResource } from '@/src/models/dial/resource';

/**
 * Which surface wrote an interceptor option offered by the widened attach picker (`Interceptors.tsx`)
 * — the admin-BE-tracked `Entities > Interceptors` row, or the Core-only `Assets > Interceptors`
 * resource. Carried as data on the option, never inferred from its shape, mirroring `AppRunnerOrigin`
 * (`src/components/SourceField/Application/models.ts`).
 *
 * Independent of `ConfigEntityOrigin` (`src/types/config-file-entity.ts`), which names which of
 * Core's *own* two populations an option lives in (API-written vs configuration-file) — a picker can
 * carry both dimensions on the same option; they are never collapsed into one field.
 */
export enum AssetInterceptorOrigin {
  Entity = 'Entity',
  Asset = 'Asset',
}

export interface AssetInterceptorTagged {
  assetOrigin: AssetInterceptorOrigin;
}

/**
 * One option of the widened attach picker, from either population. Not `BaseEntity`: the asset-side
 * resource types its display fields as `LocalizedText`, which the admin-BE base does not allow.
 */
export type InterceptorOption = (DialInterceptor | DialInterceptorResource) & AssetInterceptorTagged;
