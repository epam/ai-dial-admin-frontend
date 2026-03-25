'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialPopup, DialSteps, PopupSize, Step, StepStatus } from '@epam/ai-dial-ui-kit';

import { getMetricDeclarations, getMetricLatestVersion } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { generateMetricDefaultBindings } from '../../utils/metric-bindings';
import MetricConfiguration from './Configuration';
import { MetricStep } from './constants';
import MetricSelection from './MetricSelection';
import { validateMetricBindings } from './utils';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onConfirm: (metric?: Metric | null) => void;
}

const AddMetricModal: FC<Props> = ({ isModalOpen, onClose, onConfirm }) => {
  const t = useI18n();

  const [currentStepId, setCurrentStepId] = useState<string>(MetricStep.AddMetric);

  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();

  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const [selectedMetricDetails, setSelectedMetricDetails] = useState<Metric | undefined>();

  const [metricName, setMetricName] = useState<string | undefined>('');

  const [configBindings, setConfigBindings] = useState<MetricBinding[]>([]);
  const [inputBindings, setInputBindings] = useState<MetricBinding[]>([]);

  const selectedMetric = useMemo(() => metrics?.find((m) => m.id === selectedMetricId), [metrics, selectedMetricId]);

  useEffect(() => {
    if (selectedMetricId) {
      setIsMetricsLoading(true);
      getMetricLatestVersion(selectedMetricId || '').then((metric) => {
        setSelectedMetricDetails(metric as Metric);
        setIsMetricsLoading(false);
      });
    }
  }, [selectedMetricId]);

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
      header={t(TestSuitesI18nKey.AddMetric)}
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
        <DialSteps
          steps={steps}
          currentStep={currentStepId}
          onChangeStep={(step) => setCurrentStepId(step as MetricStep)}
        />

        <div className="flex-1 min-h-0 mt-4">
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
              selectedMetric={selectedMetric}
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
