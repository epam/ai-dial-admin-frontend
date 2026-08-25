import { ApplicationRoute } from '@/src/types/routes';

export const ruleDetailHref = (id: string): string =>
  `${ApplicationRoute.AnalyticsEnrichmentRules}/${encodeURIComponent(id)}`;

export const isPinnedToLatest = (evaluatorVersion?: number): boolean => evaluatorVersion == null;
