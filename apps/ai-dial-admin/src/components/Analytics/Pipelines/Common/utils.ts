import { ApplicationRoute } from '@/src/types/routes';

export const pipelineDetailHref = (name: string): string =>
  `${ApplicationRoute.AnalyticsPipelines}/${encodeURIComponent(name)}`;

export const isPinnedToLatest = (evaluatorVersion?: number): boolean => evaluatorVersion == null;
