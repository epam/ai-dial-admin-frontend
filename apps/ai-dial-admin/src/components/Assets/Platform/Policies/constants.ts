import { PolicyKind, PolicyQuantity } from '@/src/models/dial/policy';

/**
 * The only values Core accepts for a budget today (`quantity` must be `cost`). The enums stay complete in
 * the model, so a later Core release only widens these lists.
 */
export const POLICY_KIND_OPTIONS = [{ value: PolicyKind.BUDGET, label: PolicyKind.BUDGET }];

export const POLICY_QUANTITY_OPTIONS = [{ value: PolicyQuantity.COST, label: PolicyQuantity.COST }];

/** The defaults a new policy starts from; Core requires every one of them on a write. */
export const NEW_POLICY_DEFAULTS = {
  kind: PolicyKind.BUDGET,
  quantity: PolicyQuantity.COST,
  object: '*',
};
