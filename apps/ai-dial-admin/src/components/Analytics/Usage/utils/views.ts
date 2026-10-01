import { PRICED_VIEWS } from '@/src/components/Analytics/Usage/constants';
import { UsageView } from '@/src/components/Analytics/Usage/models';

/**
 * Whether a view offers cost. One predicate rather than a test for the LLM view at each control, so
 * a view added later cannot inherit a cost switch by falling into an `else`.
 */
export const isPricedView = (view: UsageView): boolean => PRICED_VIEWS.includes(view);
