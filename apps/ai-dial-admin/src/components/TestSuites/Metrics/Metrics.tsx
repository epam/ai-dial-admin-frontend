'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  DialCollapsibleSidebar,
  DialLoader,
  DialNoDataContent,
  DialPrimaryButton,
} from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import {
  createTestSuiteMetric,
  deleteTestSuiteMetric,
  getMetricDeclarations,
  getTestSuiteMetricDetailsWithSchema,
  getTestSuiteMetrics,
  updateTestSuiteMetric,
} from '@/src/app/[lang]/test-suites/actions';
import Search from '@/src/components/Common/Search/Search';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import AddMetricModal from './AddMetricModal';
import MetricContent from './MetricContent';

interface Props {
  selectedTestSuite: TestSuite;
}

const Metrics: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [activeMetricDetails, setActiveMetricDetails] = useState<Metric | null>(null);

  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();
  const [metricDeclarations, setMetricDeclarations] = useState<Metric[] | undefined>();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pattern, setPattern] = useState<string>('');

  const filteredMetrics = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    return metrics?.filter((metric) => metric?.name?.toLowerCase().includes(patternLower)) || [];
  }, [metrics, pattern]);

  const loadMetricDetails = useCallback(
    (metric: Metric) => {
      setIsDetailsLoading(true);
      getTestSuiteMetricDetailsWithSchema(selectedTestSuite.id as string, metric.id as string).then((response) => {
        setActiveMetricDetails(response);
        setIsDetailsLoading(false);
      });
    },
    [selectedTestSuite.id],
  );

  const onRemoveMetric = useCallback(() => {
    deleteTestSuiteMetric(selectedTestSuite.id as string, activeMetricDetails?.id as string).then((response) => {
      if (response?.success) {
        getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((response) => {
          setMetrics(response?.content);
        });
        setActiveMetricDetails(null);
      }
    });
  }, [selectedTestSuite.id, activeMetricDetails?.id]);

  const onAddMetric = useCallback(
    (metric?: Metric | null) => {
      if (metric) {
        setIsAddModalOpen(false);
        createTestSuiteMetric(selectedTestSuite.id as string, metric).then((response) => {
          if (response?.success) {
            getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((response) => {
              setMetrics(response?.content);
            });
          }
        });
      }
    },
    [selectedTestSuite.id],
  );

  const onUpdateMetric = useCallback(
    (metric: Metric) => {
      const newMetric = structuredClone(metric);
      delete newMetric.metricDeclaration;
      delete newMetric.metricDeclarationVersion;
      updateTestSuiteMetric(selectedTestSuite.id as string, newMetric).then((response) => {
        if (response?.success) {
          showNotification(getSuccessNotification(t(TestSuitesI18nKey.MetricUpdateSuccess)));
          getTestSuiteMetrics(selectedTestSuite.id as string, 0, 1000).then((response) => {
            setMetrics(response?.content);
            loadMetricDetails(newMetric);
          });
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.MetricUpdateFailed), response?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [loadMetricDetails, selectedTestSuite.id, showNotification, t],
  );

  useEffect(() => {
    if (!metricDeclarations) {
      getMetricDeclarations(0, 1000).then((response) => {
        setMetricDeclarations(response?.content);
      });
    }
  }, [metricDeclarations]);

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
    <div className="h-full flex flex-row gap-2">
      <DialCollapsibleSidebar
        width={280}
        title={t(TabsI18nKey.Metrics)}
        containerClassName="bg-layer-3 h-full border border-primary flex-shrink-0"
      >
        <div className="flex flex-col h-full min-h-0">
          <Search onChange={(search) => setPattern(search)} />
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex flex-row justify-between items-center mt-2 pr-[4px]">
              <span className="small">
                {t(TabsI18nKey.Metrics)}: {metrics?.length || 0}
              </span>
              <DialPrimaryButton
                appearance={ButtonAppearance.Link}
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                label={t(ButtonsI18nKey.Add)}
                onClick={() => setIsAddModalOpen(true)}
                disabled={!metricDeclarations || metricDeclarations.length === 0}
              />
            </div>
            {isMetricsLoading ? (
              <DialLoader size={40} />
            ) : filteredMetrics.length ? (
              <div className="flex flex-col gap-2" key={activeMetricDetails?.id}>
                {filteredMetrics.map((metric) => (
                  <div
                    key={metric.id}
                    className={classNames(
                      'rounded flex flex-row justify-between h-[38px] shrink-0 items-center px-3 cursor-pointer border-l-2 border-transparent hover:bg-accent-primary-alpha',
                      metric.id === activeMetricDetails?.id && 'bg-accent-primary-alpha border-l-accent-primary',
                    )}
                    onClick={() => loadMetricDetails(metric)}
                  >
                    <span className="text-primary">{metric.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1">
                <DialNoDataContent title={t(EntitiesI18nKey.NoMetrics)} />
              </div>
            )}
          </div>
        </div>
      </DialCollapsibleSidebar>
      <div className="border border-primary p-4 w-full overflow-auto">
        {isDetailsLoading ? (
          <DialLoader size={40} />
        ) : activeMetricDetails ? (
          <MetricContent
            selectedTestSuite={selectedTestSuite}
            metric={activeMetricDetails}
            onUpdate={onUpdateMetric}
            onDelete={onRemoveMetric}
          />
        ) : (
          <DialNoDataContent title={t(EntitiesI18nKey.NoMetrics)} />
        )}
      </div>
      {isAddModalOpen &&
        createPortal(
          <AddMetricModal
            isModalOpen={isAddModalOpen}
            metrics={metricDeclarations || []}
            onClose={() => setIsAddModalOpen(false)}
            onConfirm={onAddMetric}
          />,
          document.body,
        )}
    </div>
  );
};

export default Metrics;
