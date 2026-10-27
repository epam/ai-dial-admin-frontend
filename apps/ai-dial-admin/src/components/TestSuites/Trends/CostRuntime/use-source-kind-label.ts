'use client';

import { useDeploymentType } from '@/src/components/Runs/Summary/use-deployment-type';
import {
  resolveSuiteSourceKind,
  sourceKindDisplayLabel,
} from '@/src/components/TestSuites/Trends/CostRuntime/utils/source-kind-label';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

export const useSourceKindLabel = (suite: TestSuite): string => {
  const t = useI18n();
  const needsTypeLookup = Boolean(suite.deploymentRef?.id) && !suite.deploymentRef?.type;
  const { deploymentType } = useDeploymentType(needsTypeLookup ? suite.deploymentRef : null);
  const kind = resolveSuiteSourceKind(suite, deploymentType);
  return sourceKindDisplayLabel(kind, t(TestSuitesI18nKey.TrendsSourceFallback));
};
