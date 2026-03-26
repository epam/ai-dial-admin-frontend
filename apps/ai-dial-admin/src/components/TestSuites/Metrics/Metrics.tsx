'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialLoader, DialNeutralButton, DialNoDataContent, DialPrimaryButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

import {
  createTestSuiteMetric,
  deleteTestSuiteMetric,
  getTestSuiteMetrics,
  updateTestSuiteMetric,
} from '@/src/app/[lang]/test-suites/actions';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import AddMetricModal from './AddMetric/AddMetricModal';
import MetricBindingsDisplay from './MetricBindingsDisplay';

interface Props {
  selectedTestSuite: TestSuite;
}

const Metrics: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [metricToEdit, setMetricToEdit] = useState<Metric | undefined>();

  const onRemoveMetric = useCallback(
    (metricId: string) => {
      deleteTestSuiteMetric(selectedTestSuite.id as string, metricId).then((response) => {
        if (response?.success) {
          getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((response) => {
            setMetrics(response?.content);
          });
        }
      });
    },
    [selectedTestSuite.id],
  );

  const onAddMetric = useCallback(
    (metric?: Metric | null) => {
      if (metric) {
        setIsAddModalOpen(false);
        setMetricToEdit(undefined);
        createTestSuiteMetric(selectedTestSuite.id as string, metric).then((response) => {
          if (response?.success) {
            showNotification(getSuccessNotification(t(TestSuitesI18nKey.MetricAddSuccess)));
            getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((r) => {
              setMetrics(r?.content);
            });
          } else {
            showNotification(
              getErrorNotification(t(TestSuitesI18nKey.MetricAddFailed), response?.errorMessage || 'Unknown error'),
            );
          }
        });
      }
    },
    [selectedTestSuite.id, showNotification, t],
  );

  const onEditMetric = useCallback(
    (metric: Metric) => {
      if (metric) {
        setIsAddModalOpen(false);
        setMetricToEdit(undefined);
        const newMetric = structuredClone(metric);
        delete newMetric.metricDeclaration;
        delete newMetric.metricDeclarationVersion;
        updateTestSuiteMetric(selectedTestSuite.id as string, newMetric).then((response) => {
          if (response?.success) {
            showNotification(getSuccessNotification(t(TestSuitesI18nKey.MetricUpdateSuccess)));
            getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((response) => {
              setMetrics(response?.content);
            });
          } else {
            showNotification(
              getErrorNotification(t(TestSuitesI18nKey.MetricUpdateFailed), response?.errorMessage || 'Unknown error'),
            );
          }
        });
      }
    },
    [selectedTestSuite.id, showNotification, t],
  );

  useEffect(() => {
    if (!metrics) {
      setIsMetricsLoading(true);
      getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((response) => {
        setMetrics(response?.content);
        setIsMetricsLoading(false);
      });
    }
  }, [metrics, selectedTestSuite.id]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-row justify-between items-center">
        <h1 className="mb-4">
          {t(TabsI18nKey.Metrics)}: {metrics?.length || 0}
        </h1>

        <DialPrimaryButton
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          label={t(ButtonsI18nKey.Add)}
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>
      {isMetricsLoading ? (
        <DialLoader size={44} />
      ) : (
        <div className="flex-1 min-w-0 min-h-0">
          {metrics?.length ? (
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="rounded border border-secondary p-4 flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-between">
                    <span className="dial-body-semi">{metric.name}</span>

                    <div className="flex flex-row items-center gap-3">
                      <DialNeutralButton
                        size={ElementSize.Small}
                        label={t(ButtonsI18nKey.Delete)}
                        onClick={() => onRemoveMetric(metric.id as string)}
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
                    <span className="dial-tiny-text text-secondary line-clamp-2" title={metric.description}>
                      {metric.description}
                    </span>
                  )}

                  <MetricBindingsDisplay title={t(TestSuitesI18nKey.Configuration)} bindings={metric.configBindings} />
                </div>
              ))}
            </div>
          ) : (
            <DialNoDataContent title={t(EntitiesI18nKey.NoMetrics)} />
          )}
        </div>
      )}

      {isAddModalOpen &&
        createPortal(
          <AddMetricModal
            isModalOpen={isAddModalOpen}
            selectedTestSuiteId={selectedTestSuite.id as string}
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
    </div>
  );
};

export default Metrics;
