import { AnalyticsFieldType } from '@/src/models/analytics/entity';

// The catalog's own wire codes, which is what an evaluator variable's `type` resolves against. The aliases
// the service also accepts (`double`/`float`, `datetime`, `int`, `bool`) are deliberately not offered: each
// stores as a different canonical code, so offering both would let an operator pick a value the service
// silently renames. A variable already carrying one keeps it, via `withStrandedOption`.
export const EVALUATOR_VAR_TYPES: string[] = Object.values(AnalyticsFieldType);
