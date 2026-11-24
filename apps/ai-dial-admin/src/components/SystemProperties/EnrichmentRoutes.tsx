'use client';

import { FC } from 'react';

import { GhostButton, Label } from '@epam/ai-dial-ui-kit';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import EnrichmentRouteFields from '@/src/components/Analytics/Common/EnrichmentRouteFields';
import { useEnrichmentRouteSuggestions } from '@/src/components/Analytics/Common/use-enrichment-route-suggestions';
import { AnalyticsPipelinesI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { isRouteListFull } from '@/src/utils/analytics/enrichment-routes';
import { EnrichmentRoutesState } from './hooks/use-enrichment-routes';

interface Props {
  routes: EnrichmentRoutesState;
}

const EnrichmentRoutes: FC<Props> = ({ routes }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { rows, problems, isLoading, isReadFailed, onAddRow, onRemoveRow, onChangeRow } = routes;
  const suggestions = useEnrichmentRouteSuggestions(!isLoading);
  const isDisabled = isReadOnlyAdmin || isLoading || isReadFailed;
  const title = t(SystemPropertiesI18nKey.EnrichmentRoutesTitle);

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex items-center mb-4 h-10">
        <h1>{title}</h1>
      </div>
      <p className="dial-small-text text-secondary mb-4 max-w-[560px]">
        {t(SystemPropertiesI18nKey.EnrichmentRoutesDescription)}
      </p>
      <div className="flex flex-col gap-4 max-w-[720px]">
        {rows.length > 0 && (
          <div className="-mb-2 flex flex-row gap-3">
            <Label label={t(AnalyticsPipelinesI18nKey.RouteDeployment)} containerClassName="min-w-0 flex-1" />
            <Label label={t(AnalyticsPipelinesI18nKey.Route)} containerClassName="min-w-0 flex-1" />
            <span className="w-10 shrink-0" />
          </div>
        )}
        {rows.map((row, index) => {
          const position = ` ${index + 1}`;

          return (
            <div
              key={row.id}
              role="group"
              aria-label={`${title}${position}`}
              className="flex flex-row items-start gap-3"
            >
              <EnrichmentRouteFields
                hasLabels={false}
                idPrefix={row.id}
                deployment={row.deployment}
                route={row.route}
                suggestions={suggestions}
                problems={problems[row.id]}
                ariaSuffix={position}
                isDisabled={isDisabled}
                className="min-w-0 flex-1"
                onChange={(patch) => onChangeRow(row.id, patch)}
              />
              <RemoveButton
                className="shrink-0"
                aria-label={`${t(SystemPropertiesI18nKey.EnrichmentRoutesRemove)}${position}`}
                disabled={isDisabled}
                onClick={() => onRemoveRow(row.id)}
              />
            </div>
          );
        })}
        <GhostButton
          className="self-start"
          label={t(SystemPropertiesI18nKey.EnrichmentRoutesAdd)}
          disabled={isDisabled || isRouteListFull(rows)}
          onClick={onAddRow}
        />
      </div>
    </div>
  );
};

export default EnrichmentRoutes;
