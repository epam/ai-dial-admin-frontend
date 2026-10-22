'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopup, Spinner, NoDataContent, PrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import {
  createTestSuiteMetric,
  deleteTestSuiteMetric,
  getDetailedMetricDeclarations,
  getTestSuiteMetrics,
  getTestSuiteMetricsAggregated,
  updateTestSuiteMetric,
} from '@/src/app/[lang]/test-suites/actions';
import { ButtonsI18nKey, DeleteI18nKey, EntitiesI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import AddMetricModal from './AddMetric/AddMetricModal';
import MetricCard from './MetricCard';
import ScoreSettings from './ScoreSettings/ScoreSettings';
import { stripMetricFromScoreWeights } from './ScoreSettings/utils';

interface Props {
  selectedTestSuite: TestSuite;
  dataset?: Dataset | null;
  onChange: (testSuite: TestSuite) => void;
}

const Metrics: FC<Props> = ({ selectedTestSuite, dataset, onChange }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();
  const [metricDeclarations, setMetricDeclarations] = useState<Metric[] | undefined>();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [metricToEdit, setMetricToEdit] = useState<Metric | undefined>();

  const loadMetrics = useCallback(() => {
    const testSuiteId = selectedTestSuite.id as string;

    // The aggregated endpoint doesn't serialize `condition` (same gap as the per-metric
    // `.../aggregated` endpoint - see AddMetricModal.tsx), so it's backfilled from the plain list,
    // which does. Remove this merge once the aggregated response carries `condition` itself.
    return Promise.all([getTestSuiteMetricsAggregated(testSuiteId), getTestSuiteMetrics(testSuiteId, 0, 1000)]).then(
      ([aggregatedMetrics, plainMetrics]) => {
        const conditionByMetricId = new Map(plainMetrics?.content?.map((metric) => [metric.id, metric.condition]));

        setMetrics(
          aggregatedMetrics?.map((metric) => ({
            ...metric,
            condition: metric.condition ?? conditionByMetricId.get(metric.id),
            description: metric.description ?? metric.metricDeclaration?.description,
            outputSchema: metric.outputSchema ?? metric.metricDeclarationVersion?.outputSchema,
          })) || [],
        );
      },
    );
  }, [selectedTestSuite.id]);

  const onRemoveMetric = useCallback(
    (metricId: string) => {
      const removedMetricName = metrics?.find((metric) => metric.id === metricId)?.name;

      deleteTestSuiteMetric(selectedTestSuite.id as string, metricId).then((response) => {
        setIsDeleteModalOpen(false);
        setMetricToEdit(undefined);
        if (response?.success) {
          loadMetrics();

          if (removedMetricName) {
            const nextSuite = stripMetricFromScoreWeights(selectedTestSuite, removedMetricName);
            if (nextSuite !== selectedTestSuite) {
              onChange(nextSuite);
            }
          }
        }
      });
    },
    [loadMetrics, metrics, onChange, selectedTestSuite],
  );

  const onAddMetric = useCallback(
    (metric?: Metric | null) => {
      if (metric) {
        setIsAddModalOpen(false);
        setMetricToEdit(undefined);
        createTestSuiteMetric(selectedTestSuite.id as string, metric).then((response) => {
          if (response?.success) {
            showNotification(getSuccessNotification(t(TestSuitesI18nKey.MetricAddSuccess)));
            loadMetrics();
          } else {
            showNotification(
              getErrorNotification(t(TestSuitesI18nKey.MetricAddFailed), response?.errorMessage || 'Unknown error'),
            );
          }
        });
      }
    },
    [loadMetrics, selectedTestSuite.id, showNotification, t],
  );

  const onEditMetric = useCallback(
    (metric: Metric) => {
      if (metric) {
        setIsAddModalOpen(false);
        setMetricToEdit(undefined);
        const newMetric = structuredClone({ ...metricToEdit, ...metric });
        delete newMetric.metricDeclaration;
        delete newMetric.metricDeclarationVersion;

        updateTestSuiteMetric(selectedTestSuite.id as string, newMetric).then((response) => {
          if (response?.success) {
            showNotification(getSuccessNotification(t(TestSuitesI18nKey.MetricUpdateSuccess)));
            loadMetrics();
          } else {
            showNotification(
              getErrorNotification(t(TestSuitesI18nKey.MetricUpdateFailed), response?.errorMessage || 'Unknown error'),
            );
          }
        });
      }
    },
    [loadMetrics, metricToEdit, selectedTestSuite.id, showNotification, t],
  );

  useEffect(() => {
    if (metrics) {
      return;
    }

    setIsMetricsLoading(true);
    loadMetrics().finally(() => setIsMetricsLoading(false));
  }, [metrics, loadMetrics]);

  useEffect(() => {
    if (!isAddModalOpen || metricDeclarations) {
      return;
    }

    getDetailedMetricDeclarations().then((declarations) => setMetricDeclarations(declarations || []));
  }, [isAddModalOpen, metricDeclarations]);

  const hasMetrics = Boolean(metrics?.length);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-1 min-w-0 min-h-0 flex-row gap-4">
        <div className="flex flex-1 min-w-0 min-h-0 flex-col gap-6">
          <div className="flex flex-row justify-between items-center">
            <h1 className="mb-4">
              {t(TabsI18nKey.Metrics)}: {metrics?.length || 0}
            </h1>

            <PrimaryButton
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              label={t(ButtonsI18nKey.Add)}
              disabled={!selectedTestSuite.datasetId}
              onClick={() => setIsAddModalOpen(true)}
            />
          </div>
          {!selectedTestSuite.datasetId && (
            <p className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.DatasetRequiredForMetrics)}</p>
          )}
          {isMetricsLoading ? (
            <Spinner size={44} fullWidth />
          ) : (
            <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
              {hasMetrics ? (
                <div className="flex flex-col gap-4">
                  {metrics!.map((metric) => (
                    <MetricCard
                      key={metric.id}
                      metric={metric}
                      onDelete={() => {
                        setMetricToEdit(metric);
                        setIsDeleteModalOpen(true);
                      }}
                      onEdit={() => {
                        setMetricToEdit(metric);
                        setIsAddModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <NoDataContent title={t(EntitiesI18nKey.NoMetrics)} />
              )}
            </div>
          )}
        </div>

        {isMetricsLoading ? (
          <div className="flex w-[420px] shrink-0 items-center justify-center rounded bg-layer-3 p-4">
            <Spinner size={44} fullWidth />
          </div>
        ) : (
          hasMetrics && (
            <div className="w-[420px] shrink-0">
              <ScoreSettings
                selectedTestSuite={selectedTestSuite}
                metrics={metrics}
                testCaseSchema={dataset?.testCaseSchema}
                onChange={onChange}
              />
            </div>
          )
        )}
      </div>

      {isAddModalOpen &&
        createPortal(
          <AddMetricModal
            isModalOpen={isAddModalOpen}
            selectedTestSuite={selectedTestSuite}
            dataset={dataset}
            metricDeclarations={metricDeclarations}
            onClose={() => {
              setIsAddModalOpen(false);
              setMetricToEdit(undefined);
            }}
            onConfirm={(metric) => {
              if (metricToEdit) {
                onEditMetric(metric!);
              } else {
                onAddMetric(metric);
              }
            }}
            editingMetric={metricToEdit}
          />,
          document.body,
        )}
      {isDeleteModalOpen &&
        createPortal(
          <ConfirmationPopup
            open={isDeleteModalOpen}
            header={t(DeleteI18nKey.Title, { entity: t(TestSuitesI18nKey.Metric) })}
            onConfirm={() => onRemoveMetric(metricToEdit?.id as string)}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setMetricToEdit(undefined);
            }}
            confirmLabel={t(ButtonsI18nKey.Delete)}
            description={t(DeleteI18nKey.Confirming, {
              entity: `${metricToEdit?.name} ${t(TestSuitesI18nKey.Metric)}`,
            })}
          />,

          document.body,
        )}
    </div>
  );
};

export default Metrics;
