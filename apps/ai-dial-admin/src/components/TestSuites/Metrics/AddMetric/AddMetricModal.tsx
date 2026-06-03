'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialLoader,
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
  DialSteps,
  PopupSize,
  Step,
  StepStatus,
} from '@epam/ai-dial-ui-kit';

import {
  getMetricDeclarations,
  getMetricLatestVersion,
  getTestSuiteMetricDetailsWithSchema,
} from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { Dataset } from '@/src/models/evaluation/dataset';
import classNames from 'classnames';
import { generateMetricDefaultBindings, generateMetricDefaultInputBindings } from '../../utils/metric-bindings';
import MetricConfiguration from './Configuration';
import { MetricStep } from './constants';
import MetricSelection from './MetricSelection';
import { validateMetricBindings } from './utils';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onConfirm: (metric?: Metric | null) => void;
  editingMetric?: Metric;
  selectedTestSuite?: TestSuite;
  dataset?: Dataset | null;
}

const AddMetricModal: FC<Props> = ({ isModalOpen, onClose, onConfirm, editingMetric, selectedTestSuite, dataset }) => {
  const t = useI18n();

  const isEditMode = !!editingMetric;
  const [currentStepId, setCurrentStepId] = useState<string>(
    isEditMode ? MetricStep.Configuration : MetricStep.AddMetric,
  );

  const [isMetricDeclarationsLoading, setIsMetricDeclarationsLoading] = useState(false);
  const [isMetricDetailsLoading, setIsMetricDetailsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[] | undefined>();

  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const [selectedMetricDetails, setSelectedMetricDetails] = useState<Metric | undefined>();

  const [metricName, setMetricName] = useState<string | undefined>('');

  const [configBindings, setConfigBindings] = useState<MetricBinding[]>([]);
  const [inputBindings, setInputBindings] = useState<MetricBinding[]>([]);
  const [isJsonView, setIsJsonView] = useState(false);

  const selectedMetric = useMemo(() => metrics?.find((m) => m.id === selectedMetricId), [metrics, selectedMetricId]);

  useEffect(() => {
    if (selectedMetricId) {
      setIsMetricDetailsLoading(true);
      getMetricLatestVersion(selectedMetricId || '').then((metric) => {
        setSelectedMetricDetails(metric as Metric);
        setConfigBindings(generateMetricDefaultInputBindings(metric?.configSchema ?? {}));
        setInputBindings(generateMetricDefaultInputBindings(metric?.inputSchema ?? {}));
        setIsMetricDetailsLoading(false);
      });
    }
  }, [selectedMetricId]);

  useEffect(() => {
    if (editingMetric?.id && selectedTestSuite?.id) {
      setIsMetricDetailsLoading(true);
      Promise.all([
        getTestSuiteMetricDetailsWithSchema(selectedTestSuite.id as string, editingMetric.id as string),
        getMetricLatestVersion(editingMetric.metricDeclarationId as string),
      ]).then(([metricDetails, metric]) => {
        setConfigBindings(metricDetails?.configBindings ?? []);
        setInputBindings(metricDetails?.inputBindings ?? []);
        setSelectedMetricDetails(metric as Metric);
        setIsMetricDetailsLoading(false);
      });
    }
  }, [editingMetric?.id, editingMetric?.metricDeclarationId, editingMetric?.name, selectedTestSuite?.id]);

  useEffect(() => {
    setMetricName(selectedMetric?.displayName ?? editingMetric?.name ?? '');
  }, [selectedMetric, editingMetric?.name]);

  const isStep1Valid = !!selectedMetricId;
  const isStep2Valid = isJsonView
    ? true
    : validateMetricBindings(
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
      setIsMetricDeclarationsLoading(true);
      getMetricDeclarations(0, 1000).then((response) => {
        setMetrics(response?.content || []);
        setIsMetricDeclarationsLoading(false);
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
        isEditMode ? (
          <div className="flex flex-row items-center gap-2 px-6 py-4 justify-end">
            <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
            <DialPrimaryButton label={t(ButtonsI18nKey.Confirm)} disabled={!isStep2Valid} onClick={onFinishClick} />
          </div>
        ) : (
          <StepperModalButtons
            steps={steps}
            currentStep={steps.find((s) => s.id === currentStepId)}
            onChangeStep={setCurrentStepId}
            onFinishClick={onFinishClick}
            onClose={onClose}
          />
        )
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

        <div className={classNames('flex-1 min-h-0 overflow-auto', { 'mt-4': !isEditMode })}>
          {currentStepId === MetricStep.AddMetric && isMetricDeclarationsLoading && <DialLoader size={44} />}
          {currentStepId === MetricStep.Configuration && isMetricDetailsLoading && <DialLoader size={44} />}
          {currentStepId === MetricStep.AddMetric && !isMetricDeclarationsLoading && (
            <MetricSelection
              metrics={metrics || []}
              selectedMetricId={selectedMetricId}
              onSelectMetric={setSelectedMetricId}
            />
          )}

          {currentStepId === MetricStep.Configuration && !isMetricDetailsLoading && (
            <MetricConfiguration
              metricName={metricName}
              selectedMetric={selectedMetric || editingMetric}
              configBindings={configBindings}
              inputBindings={inputBindings}
              onChangeName={setMetricName}
              selectedTestSuite={selectedTestSuite}
              testCaseSchema={dataset?.testCaseSchema}
              selectedMetricDetails={selectedMetricDetails}
              onChangeConfigBindings={setConfigBindings}
              onChangeInputBindings={setInputBindings}
              onJsonViewChange={setIsJsonView}
            />
          )}
        </div>
      </div>
    </DialPopup>
  );
};
export default AddMetricModal;
