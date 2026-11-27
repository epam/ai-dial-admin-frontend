import { COVERAGE_KIND_ORDER, COVERAGE_KIND_SOURCES } from '@/src/components/EvalSystemHealth/constants';
import {
  CoverageCardModel,
  CoverageKind,
  CoverageSources,
  CoverageStatus,
} from '@/src/components/EvalSystemHealth/models';
import { normalizeDeploymentId } from '@/src/components/EvalSystemHealth/utils/normalize-deployment-id';

interface KindCount {
  total: number;
  covered: number;
}

const NOT_READY_COUNT: KindCount = { total: 0, covered: 0 };

/** Error wins over loading: a card that already knows it cannot be drawn should not keep spinning. */
const statusOf = (sources: CoverageSources, kind: CoverageKind): CoverageStatus => {
  const statuses = COVERAGE_KIND_SOURCES[kind].map((key) => sources[key].status);
  if (statuses.includes(CoverageStatus.Error)) {
    return CoverageStatus.Error;
  }
  if (statuses.includes(CoverageStatus.Loading)) {
    return CoverageStatus.Loading;
  }
  return CoverageStatus.Ready;
};

/** Counts each listed evaluatee once, however it is written, and how many of them the covered set holds. */
const countKind = (listed: string[], covered: Set<string>, toKey: (id: string) => string): KindCount => {
  const existing = new Set(listed.map(toKey));
  let coveredCount = 0;
  for (const key of existing) {
    if (covered.has(key)) {
      coveredCount += 1;
    }
  }
  return { total: existing.size, covered: coveredCount };
};

const keepAsWritten = (name: string): string => name;

const sumCounts = (counts: KindCount[]): KindCount => ({
  total: counts.reduce((sum, count) => sum + count.total, 0),
  covered: counts.reduce((sum, count) => sum + count.covered, 0),
});

/** Each kind counts from only its own sources, so a kind whose sources are not all in gets the not-ready count. */
const countsByKind = ({ deployments, routes, covered }: CoverageSources): Record<CoverageKind, KindCount> => {
  const listed = deployments.value;
  const listedRoutes = routes.value;
  const coveredIds = covered.value;

  const models =
    listed && coveredIds ? countKind(listed.models, coveredIds.deployments, normalizeDeploymentId) : NOT_READY_COUNT;
  const applications =
    listed && coveredIds
      ? countKind(listed.applications, coveredIds.deployments, normalizeDeploymentId)
      : NOT_READY_COUNT;
  const toolsets =
    listed && coveredIds ? countKind(listed.toolsets, coveredIds.deployments, normalizeDeploymentId) : NOT_READY_COUNT;
  const routeCount =
    listedRoutes && coveredIds ? countKind(listedRoutes, coveredIds.routes, keepAsWritten) : NOT_READY_COUNT;

  return {
    [CoverageKind.Models]: models,
    [CoverageKind.Applications]: applications,
    [CoverageKind.Toolsets]: toolsets,
    [CoverageKind.Routes]: routeCount,
    [CoverageKind.Evaluatees]: sumCounts([models, applications, toolsets, routeCount]),
  };
};

/** The five coverage cards, in display order. Each one's status follows only the sources it needs. */
export const buildCoverageCards = (sources: CoverageSources): CoverageCardModel[] => {
  const counts = countsByKind(sources);

  return COVERAGE_KIND_ORDER.map((kind) => {
    const status = statusOf(sources, kind);
    const { total, covered } = status === CoverageStatus.Ready ? counts[kind] : NOT_READY_COUNT;
    return {
      kind,
      status,
      total,
      covered,
      uncovered: total - covered,
      rate: status === CoverageStatus.Ready && total > 0 ? covered / total : null,
    };
  });
};
