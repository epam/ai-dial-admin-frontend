'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialPopup, DialSteps, PopupSize, Step, StepStatus } from '@epam/ai-dial-ui-kit';

import {
  getMetricDeclarations,
  getMetricLatestVersion,
  getTestSuiteMetricDetailsWithSchema,
} from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import classNames from 'classnames';
import { generateMetricDefaultBindings, generateMetricDefaultInputBindings } from '../../utils/metric-bindings';
import MetricConfiguration from './Configuration';
import { MetricStep } from './constants';
import MetricSelection from './MetricSelection';
import { validateMetricBindings } from './utils';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onConfirm: (metric?: Metric | null) => void;
  editingMetric?: Metric;
  selectedTestSuiteId?: string;
}

const AddMetricModal: FC<Props> = ({ isModalOpen, onClose, onConfirm, editingMetric, selectedTestSuiteId }) => {
  const t = useI18n();

  const isEditMode = !!editingMetric;
  const [currentStepId, setCurrentStepId] = useState<string>(
    isEditMode ? MetricStep.Configuration : MetricStep.AddMetric,
  );

  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();

  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const [selectedMetricDetails, setSelectedMetricDetails] = useState<Metric | undefined>();

  const [metricName, setMetricName] = useState<string | undefined>(editingMetric?.name ?? '');

  const [configBindings, setConfigBindings] = useState<MetricBinding[]>([]);
  const [inputBindings, setInputBindings] = useState<MetricBinding[]>([]);

  const selectedMetric = useMemo(() => metrics?.find((m) => m.id === selectedMetricId), [metrics, selectedMetricId]);

  useEffect(() => {
    if (selectedMetricId) {
      setIsMetricsLoading(true);
      getMetricLatestVersion(selectedMetricId || '').then((metric) => {
        setSelectedMetricDetails(metric as Metric);
        setConfigBindings(generateMetricDefaultInputBindings(metric?.configSchema ?? {}));
        setInputBindings(generateMetricDefaultInputBindings(metric?.inputSchema ?? {}));
        setIsMetricsLoading(false);
      });
    }
  }, [selectedMetricId]);

  useEffect(() => {
    if (editingMetric?.id && selectedTestSuiteId) {
      setIsMetricsLoading(true);
      setMetricName(editingMetric.name);
      Promise.all([
        getTestSuiteMetricDetailsWithSchema(selectedTestSuiteId as string, editingMetric.id as string),
        getMetricLatestVersion(editingMetric.metricDeclarationId as string),
      ]).then(([metricDetails, metric]) => {
        setConfigBindings(metricDetails?.configBindings ?? []);
        setInputBindings(metricDetails?.inputBindings ?? []);
        setSelectedMetricDetails(metric as Metric);
        setIsMetricsLoading(false);
      });
    }
  }, [editingMetric?.id, editingMetric?.metricDeclarationId, editingMetric?.name, selectedTestSuiteId]);

  useEffect(() => {
    setMetricName(selectedMetric?.name ?? '');
  }, [selectedMetric]);

  const isStep1Valid = !!selectedMetricId;
  const isStep2Valid = validateMetricBindings(
    metricName,
    configBindings,
    inputBindings,
    selectedMetricDetails?.configSchema,
    selectedMetricDetails?.inputSchema,
  );

  const steps: Step[] = useMemo(
    () => [
      {
        id: MetricStep.AddMetric,
        name: t(TestSuitesI18nKey.AddMetric),
        status: isStep1Valid ? StepStatus.VALID : undefined,
      },
      {
        id: MetricStep.Configuration,
        name: t(TestSuitesI18nKey.Configuration),
        status: isStep2Valid ? StepStatus.VALID : undefined,
      },
    ],
    [t, isStep1Valid, isStep2Valid],
  );

  const onFinishClick = useCallback(() => {
    if (selectedMetricDetails) {
      onConfirm(generateMetricDefaultBindings(metricName ?? '', selectedMetricDetails, configBindings, inputBindings));
    }
  }, [configBindings, inputBindings, metricName, onConfirm, selectedMetricDetails]);

  useEffect(() => {
    if (!metrics) {
      setIsMetricsLoading(true);
      getMetricDeclarations(0, 1000).then((response) => {
        setMetrics(response?.content || []);
        setIsMetricsLoading(false);
      });
    }
  }, [metrics]);

  return (
    <DialPopup
      onClose={onClose}
      header={isEditMode ? t(TestSuitesI18nKey.EditMetric) : t(TestSuitesI18nKey.AddMetric)}
      portalId="AddMetricModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="h-[800px]"
      dividers
      footer={
        <StepperModalButtons
          steps={steps}
          currentStep={steps.find((s) => s.id === currentStepId)}
          onChangeStep={setCurrentStepId}
          onFinishClick={onFinishClick}
          onClose={onClose}
        />
      }
    >
      <div className="h-full flex flex-col min-h-0 px-6 py-4">
        {!isEditMode && (
          <DialSteps
            steps={steps}
            currentStep={currentStepId}
            onChangeStep={(step) => setCurrentStepId(step as MetricStep)}
          />
        )}

        <div className={classNames('flex-1 min-h-0', { 'mt-4': !isEditMode })}>
          {isMetricsLoading && <DialLoader size={44} />}
          {currentStepId === MetricStep.AddMetric && !isMetricsLoading && (
            <MetricSelection
              metrics={metrics || []}
              selectedMetricId={selectedMetricId}
              onSelectMetric={setSelectedMetricId}
            />
          )}

          {currentStepId === MetricStep.Configuration && !isMetricsLoading && (
            <MetricConfiguration
              metricName={metricName}
              selectedMetric={selectedMetric || editingMetric}
              configBindings={configBindings}
              inputBindings={inputBindings}
              onChangeName={setMetricName}
              selectedMetricDetails={selectedMetricDetails}
              onChangeConfigBindings={setConfigBindings}
              onChangeInputBindings={setInputBindings}
            />
          )}
        </div>
      </div>
    </DialPopup>
  );
};
export default AddMetricModal;
