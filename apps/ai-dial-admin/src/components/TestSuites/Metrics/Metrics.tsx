'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  DialConfirmationPopup,
  DialDangerButton,
  DialLoader,
  DialNeutralButton,
  DialNoDataContent,
  DialPrimaryButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

import {
  createTestSuiteMetric,
  deleteTestSuiteMetric,
  getMetricDeclarations,
  getTestSuiteMetricDetailsWithSchema,
  getTestSuiteMetrics,
  updateTestSuiteMetric,
} from '@/src/app/[lang]/test-suites/actions';
import ContentWithLinks from '@/src/components/Common/ContentWithLinks/ContentWithLinks';
import ExpandableText from '@/src/components/Common/ExpandableText/ExpandableText';
import { ButtonsI18nKey, DeleteI18nKey, EntitiesI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { Dataset } from '@/src/models/evaluation/dataset';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import AddMetricModal from './AddMetric/AddMetricModal';
import MetricBindingsDisplay from './MetricBindingsDisplay';
import ScoreSettings from './ScoreSettings/ScoreSettings';
import { mergeMetricsWithDeclarations, mergeMetricsWithOutputSchemas } from './utils';

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

    return Promise.all([getTestSuiteMetrics(testSuiteId, 0, 1000), getMetricDeclarations(0, 1000)]).then(
      ([metricsResponse, declarationsResponse]) => {
        const declarations = declarationsResponse?.content || [];
        setMetricDeclarations(declarations);

        const metricsWithDescriptions = mergeMetricsWithDeclarations(metricsResponse?.content || [], declarations);
        const metricIds = metricsWithDescriptions.map((metric) => metric.id).filter((id): id is string => !!id);

        if (!metricIds.length) {
          setMetrics(metricsWithDescriptions);
          return;
        }

        return Promise.all(
          metricIds.map((metricId) =>
            getTestSuiteMetricDetailsWithSchema(testSuiteId, metricId).then(
              (details) => [metricId, details?.metricDeclarationVersion?.outputSchema] as const,
            ),
          ),
        ).then((entries) => {
          setMetrics(mergeMetricsWithOutputSchemas(metricsWithDescriptions, new Map(entries)));
        });
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

          if (removedMetricName && selectedTestSuite.overallScore?.type === OverallScoreType.WeightedMean) {
            const { weights } = selectedTestSuite.overallScore;
            const remainingWeights = weights.filter((weight) => weight.metricName !== removedMetricName);

            if (remainingWeights.length !== weights.length) {
              onChange({
                ...selectedTestSuite,
                overallScore: { type: OverallScoreType.WeightedMean, weights: remainingWeights },
              });
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

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-row flex-1 min-w-0 min-h-0 gap-4">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-6">
          <div className="flex flex-row justify-between items-center">
            <h1 className="mb-4">
              {t(TabsI18nKey.Metrics)}: {metrics?.length || 0}
            </h1>

            <DialPrimaryButton
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
            <DialLoader size={44} />
          ) : (
            <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
              {metrics?.length ? (
                <div className="flex flex-col gap-4">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="rounded border border-secondary p-4 flex flex-col gap-4">
                      <div className="flex flex-row items-center justify-between">
                        <span className="dial-body-semi">{metric.name}</span>

                        <div className="flex flex-row items-center gap-3">
                          <DialDangerButton
                            size={ElementSize.Small}
                            label={t(ButtonsI18nKey.Delete)}
                            appearance={ButtonAppearance.Outlined}
                            onClick={() => {
                              setMetricToEdit(metric);
                              setIsDeleteModalOpen(true);
                            }}
                            iconBefore={<IconTrash stroke={2} size={16} />}
                          />
                          <DialNeutralButton
                            size={ElementSize.Small}
                            label={t(ButtonsI18nKey.Edit)}
                            onClick={() => {
                              setMetricToEdit(metric);
                              setIsAddModalOpen(true);
                            }}
                            iconBefore={<IconEdit stroke={2} size={16} />}
                          />
                        </div>
                      </div>

                      {metric.description && (
                        <ExpandableText lines={2} className="dial-tiny-text text-secondary">
                          <ContentWithLinks text={metric.description} />
                        </ExpandableText>
                      )}

                      <div className="flex flex-row gap-3 items-start">
                        <p className="dial-tiny-semi-text">{t(TestSuitesI18nKey.Condition)}:</p>
                        <span className="dial-tiny-text break-all">
                          {metric.condition?.trim() || t(TestSuitesI18nKey.ConditionAlwaysRun)}
                        </span>
                      </div>

                      <MetricBindingsDisplay
                        title={t(TestSuitesI18nKey.Configuration)}
                        bindings={metric.configBindings}
                      />
                      <MetricBindingsDisplay title={t(TestSuitesI18nKey.Inputs)} bindings={metric.inputBindings} />
                    </div>
                  ))}
                </div>
              ) : (
                <DialNoDataContent title={t(EntitiesI18nKey.NoMetrics)} />
              )}
            </div>
          )}
        </div>

        {isMetricsLoading ? (
          <div className="flex w-[516px] items-center justify-center rounded bg-layer-3 p-4">
            <DialLoader size={44} />
          </div>
        ) : (
          <ScoreSettings
            selectedTestSuite={selectedTestSuite}
            metrics={metrics}
            testCaseSchema={dataset?.testCaseSchema}
            onChange={onChange}
          />
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
          <DialConfirmationPopup
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
