import { COVERAGE_KIND_ORDER } from '@/src/components/EvalSystemHealth/constants';
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
const statusOf = ({ deployments, covered }: CoverageSources): CoverageStatus => {
  const statuses = [deployments.status, covered.status];
  if (statuses.includes(CoverageStatus.Error)) {
    return CoverageStatus.Error;
  }
  if (statuses.includes(CoverageStatus.Loading)) {
    return CoverageStatus.Loading;
  }
  return CoverageStatus.Ready;
};

/** Counts each deployed id once, however it is written, and how many of them the coverage set holds. */
const countKind = (listedIds: string[], coveredIds: Set<string>): KindCount => {
  const deployed = new Set(listedIds.map(normalizeDeploymentId));
  let covered = 0;
  for (const id of deployed) {
    if (coveredIds.has(id)) {
      covered += 1;
    }
  }
  return { total: deployed.size, covered };
};

const countsByKind = ({ deployments, covered }: CoverageSources): Record<CoverageKind, KindCount> => {
  const listed = deployments.value;
  const coveredIds = covered.value;
  if (listed == null || coveredIds == null) {
    return {
      [CoverageKind.Evaluatees]: NOT_READY_COUNT,
      [CoverageKind.Models]: NOT_READY_COUNT,
      [CoverageKind.Applications]: NOT_READY_COUNT,
      [CoverageKind.Toolsets]: NOT_READY_COUNT,
    };
  }

  const models = countKind(listed.models, coveredIds);
  const applications = countKind(listed.applications, coveredIds);
  const toolsets = countKind(listed.toolsets, coveredIds);
  return {
    [CoverageKind.Models]: models,
    [CoverageKind.Applications]: applications,
    [CoverageKind.Toolsets]: toolsets,
    [CoverageKind.Evaluatees]: {
      total: models.total + applications.total + toolsets.total,
      covered: models.covered + applications.covered + toolsets.covered,
    },
  };
};

/** The four coverage cards, in display order. Both sources feed every card, so they share one status. */
export const buildCoverageCards = (sources: CoverageSources): CoverageCardModel[] => {
  const status = statusOf(sources);
  const counts = countsByKind(sources);

  return COVERAGE_KIND_ORDER.map((kind) => {
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
