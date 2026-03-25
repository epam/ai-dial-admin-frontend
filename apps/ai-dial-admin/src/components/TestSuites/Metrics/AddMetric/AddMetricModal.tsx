'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialPopup, DialSteps, PopupSize, Step, StepStatus } from '@epam/ai-dial-ui-kit';

import { getMetricDeclarations, getMetricLatestVersion } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import MetricConfiguration from './Configuration';
import { MetricStep } from './constants';
import MetricSelection from './MetricSelection';

interface Props {
  isModalOpen: boolean;
  selectedTestSuite: TestSuite;
  onClose: () => void;
  onConfirm: (metric?: Metric | null) => void;
}

const AddMetricModal: FC<Props> = ({ isModalOpen, selectedTestSuite, onClose, onConfirm }) => {
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

  const isStep1Valid = !!selectedMetricId;
  const isStep2Valid = !!metricName?.trim();

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

  useEffect(() => {
    if (selectedMetricId) {
      setIsMetricsLoading(true);
      getMetricLatestVersion(selectedMetricId || '').then((metric) => {
        setSelectedMetricDetails(metric as Metric);
        setIsMetricsLoading(false);
      });
    }
  }, [selectedMetricId]);

  // const validateBindings = useCallback((): boolean => {
  //   // Check if metric name is non-empty
  //   if (!metricName?.trim()) {
  //     return false;
  //   }

  //   const allBindings = [...configBindings, ...inputBindings];

  //   // Check required bindings from schema
  //   const requiredConfigFields = selectedMetricParameters.filter((f) => f.required).map((f) => f.name);
  //   const requiredInputFields = selectedMetricInputs.filter((f) => f.required).map((f) => f.name);
  //   const requiredFields = [...requiredConfigFields, ...requiredInputFields];

  //   for (const field of requiredFields) {
  //     const binding = allBindings.find((b) => b.property === field);
  //     if (!binding) {
  //       return false;
  //     }
  //   }

  //   // Check non-empty values for Constant type bindings
  //   for (const binding of allBindings) {
  //     if (binding.source.$type === 'Constant') {
  //       if (binding.source.value === undefined || binding.source.value === '') {
  //         return false;
  //       }
  //     }
  //     // Check valid binding types
  //     if (binding.source.$type !== 'Constant' && binding.source.$type !== 'Column') {
  //       return false;
  //     }
  //   }

  //   return true;
  // }, [metricName, configBindings, inputBindings, selectedMetricParameters, selectedMetricInputs]);

  const onFinishClick = useCallback(() => {
    if (selectedMetricDetails) {
      onConfirm({
        name: metricName,
        metricDeclarationId: selectedMetricDetails.metricDeclarationId,
        metricDeclarationVersionId: selectedMetricDetails.id,
        configBindings,
        inputBindings,
      } as Metric);
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
              selectedMetric={selectedMetric}
              onChangeName={setMetricName}
              selectedMetricDetails={selectedMetricDetails}
            />
          )}
        </div>
      </div>
    </DialPopup>
  );
};
export default AddMetricModal;
