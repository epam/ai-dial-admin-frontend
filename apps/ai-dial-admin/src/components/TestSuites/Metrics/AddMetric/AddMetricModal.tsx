'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialPopup, DialSteps, DialTag, PopupSize, Step, StepStatus } from '@epam/ai-dial-ui-kit';

import { getMetricDeclarations } from '@/src/app/[lang]/test-suites/actions';
import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import StepperModalButtons from '../../../Common/StepperModalButtons/StepperModalButtons';
import { MetricStep } from './constants';
import MetricSelection from './MetricSelection';
import MetricConfiguration from './Configuration';

interface Props {
  isModalOpen: boolean;
  selectedTestSuite: TestSuite;
  onClose: () => void;
  onConfirm: (metric?: Metric | null) => void;
}

interface MetricSchemaSectionProps {
  title: string;
  fields: SchemaFieldRow[];
}

const MetricSchemaSection: FC<MetricSchemaSectionProps> = ({ title, fields }) => {
  return fields.length ? (
    <div className="flex flex-col gap-1">
      <h4 className="text-secondary">{title}</h4>
      <div className="flex flex-col gap-1 ml-2">
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex flex-row gap-1 items-center">
              <div className="text-sm text-primary">{field.name}</div>
              <DialTag tag={field.type} />
            </div>
            <div className="tiny text-secondary">{field.description}</div>
          </div>
        ))}
      </div>
    </div>
  ) : null;
};

const AddMetricModal: FC<Props> = ({ isModalOpen, selectedTestSuite, onClose, onConfirm }) => {
  const t = useI18n();

  const [currentStepId, setCurrentStepId] = useState<string>(MetricStep.AddMetric);

  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();

  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const [metricName, setMetricName] = useState<string>('');
  const [configBindings, setConfigBindings] = useState<MetricBinding[]>([]);
  const [inputBindings, setInputBindings] = useState<MetricBinding[]>([]);

  const selectedMetricDetails = useMemo(() => {
    return metrics?.find((m) => m.id === selectedMetricId);
  }, [metrics, selectedMetricId]);

  // Load metric details when selected
  // useEffect(() => {
  //   if (selectedMetricId) {
  //     setIsDetailsLoading(true);
  //     getMetricLatestVersion(selectedMetricId || '').then((metric) => {
  //       setSelectedMetricDetails(metric);
  //       setMetricName(metrics.find((m) => m.id === selectedMetricId)?.name || '');
  //       setConfigBindings(generateMetricDefaultInputBindings(metric?.configSchema ?? {}));
  //       setInputBindings(generateMetricDefaultInputBindings(metric?.inputSchema ?? {}));
  //       setIsDetailsLoading(false);
  //     });
  //   }
  // }, [selectedMetricId, metrics]);

  // Validation logic
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

  // Step validation
  const isStep1Valid = !!selectedMetricId;
  const isStep2Valid = true;

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
    // if (isStep2Valid && selectedMetricDetails) {
    //   const metric: Metric = {
    //     name: metricName,
    //     metricDeclarationId: selectedMetricDetails.metricDeclarationId,
    //     metricDeclarationVersionId: selectedMetricDetails.id,
    //     configBindings,
    //     inputBindings,
    //   };
    //   onConfirm(metric);
    // }
  }, []);

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
            <MetricConfiguration selectedMetricDetails={selectedMetricDetails} />
          )}

          {/* <div className="h-full flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-secondary">{t(TestSuitesI18nKey.MetricName)}</h3>
              <DialInput
                containerClassName={STANDARD_CONTROL_WIDTH}
                id="metricName"
                value={metricName}
                onChange={setMetricName}
              />
            </div>
            {selectedMetricDetails && (
              <BindingsConfiguration
                selectedTestSuite={selectedTestSuite}
                selectedMetric={{
                  ...selectedMetricDetails,
                  name: metricName,
                  configBindings,
                  inputBindings,
                }}
                onChange={handleBindingsChange}
              />
            )}
          </div> */}
        </div>
      </div>
    </DialPopup>
  );
};
export default AddMetricModal;
