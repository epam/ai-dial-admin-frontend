'use client';

import { FC, useMemo } from 'react';

import AutocompleteInput from '@/src/components/Common/AutocompleteInput/AutocompleteInput';
import { AutocompleteInputOption } from '@/src/components/Common/AutocompleteInput/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  EnrichmentRoute,
  EnrichmentRouteProblem,
  EnrichmentRouteRowProblems,
  EnrichmentRouteSuggestions,
} from '@/src/models/analytics/enrichment-routes';
import { getRouteSuggestions } from '@/src/utils/analytics/enrichment-routes';

interface Props {
  idPrefix: string;
  deployment: string;
  route: string;
  suggestions: EnrichmentRouteSuggestions;
  problems?: EnrichmentRouteRowProblems;
  hasLabels?: boolean;
  ariaSuffix?: string;
  isDisabled?: boolean;
  className?: string;
  onChange: (patch: Partial<EnrichmentRoute>) => void;
}

const PROBLEM_MESSAGE: Record<EnrichmentRouteProblem, AnalyticsPipelinesI18nKey> = {
  [EnrichmentRouteProblem.DeploymentRequired]: AnalyticsPipelinesI18nKey.RouteDeploymentRequired,
  [EnrichmentRouteProblem.DeploymentTooLong]: AnalyticsPipelinesI18nKey.RouteDeploymentTooLong,
  [EnrichmentRouteProblem.DeploymentForbidden]: AnalyticsPipelinesI18nKey.RouteDeploymentForbidden,
  [EnrichmentRouteProblem.DeploymentMalformed]: AnalyticsPipelinesI18nKey.RouteDeploymentMalformed,
  [EnrichmentRouteProblem.RouteRequired]: AnalyticsPipelinesI18nKey.RouteRequired,
  [EnrichmentRouteProblem.RouteTooLong]: AnalyticsPipelinesI18nKey.RouteTooLong,
  [EnrichmentRouteProblem.RouteMalformed]: AnalyticsPipelinesI18nKey.RouteMalformed,
  [EnrichmentRouteProblem.Repeated]: AnalyticsPipelinesI18nKey.RouteRepeated,
};

const toOptions = (values: string[]): AutocompleteInputOption[] => values.map((value) => ({ value, label: value }));

const EnrichmentRouteFields: FC<Props> = ({
  idPrefix,
  deployment,
  route,
  suggestions,
  problems,
  hasLabels = true,
  ariaSuffix = '',
  isDisabled,
  className,
  onChange,
}) => {
  const t = useI18n();

  const deploymentOptions = useMemo(() => toOptions(suggestions.deployments), [suggestions.deployments]);
  const routeOptions = useMemo(
    () => toOptions(getRouteSuggestions(suggestions, deployment)),
    [suggestions, deployment],
  );

  const deploymentLabel = t(AnalyticsPipelinesI18nKey.RouteDeployment);
  const routeLabel = t(AnalyticsPipelinesI18nKey.Route);
  const deploymentError = problems?.deployment && t(PROBLEM_MESSAGE[problems.deployment]);
  const routeError = problems?.route && t(PROBLEM_MESSAGE[problems.route]);

  return (
    <>
      <AutocompleteInput
        id={`${idPrefix}-deployment`}
        labelProps={hasLabels ? { label: deploymentLabel } : undefined}
        ariaLabel={`${deploymentLabel}${ariaSuffix}`}
        listLabel={deploymentLabel}
        value={deployment}
        suggestions={deploymentOptions}
        openOnFocus
        disabled={isDisabled}
        invalid={Boolean(deploymentError)}
        error={deploymentError}
        className={className}
        onChange={(value) => onChange({ deployment: value })}
      />
      <AutocompleteInput
        id={`${idPrefix}-route`}
        labelProps={hasLabels ? { label: routeLabel } : undefined}
        ariaLabel={`${routeLabel}${ariaSuffix}`}
        listLabel={routeLabel}
        value={route}
        suggestions={routeOptions}
        openOnFocus
        disabled={isDisabled}
        invalid={Boolean(routeError)}
        error={routeError}
        className={className}
        onChange={(value) => onChange({ route: value })}
      />
    </>
  );
};

export default EnrichmentRouteFields;
