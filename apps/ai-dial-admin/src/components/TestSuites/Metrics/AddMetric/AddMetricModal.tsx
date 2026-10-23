'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Spinner,
  OutlinedButton,
  Popup,
  PrimaryButton,
  DialSteps,
  PopupSize,
  Step,
  StepStatus,
} from '@epam/ai-dial-ui-kit';

import { getMetricLatestVersion, getTestSuiteMetricDetailsWithSchema } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric, MetricBinding } from '@/src/models/evaluation/metric';
import { Dataset } from '@/src/models/evaluation/dataset';
import classNames from 'classnames';
import { useAttributeSamples } from '@/src/components/TestSuites/View/use-attribute-samples';
import { generateMetricDefaultBindings, generateMetricDefaultInputBindings } from '../../utils/metric-bindings';
import MetricConfiguration from './Configuration';
import { MetricStep } from './constants';
import MetricSelection from './MetricSelection';
import { hasInputTypeMismatch, isReservedSystemFunctionCondition, validateMetricBindings } from './utils';
import { ResponseColumn, TestSuite } from '@/src/models/evaluation/test-suite';
import { getChainResponseColumns } from '@/src/utils/evaluation/request-chain';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onConfirm: (metric?: Metric | null) => void;
  editingMetric?: Metric;
  selectedTestSuite?: TestSuite;
  dataset?: Dataset | null;
  metricDeclarations?: Metric[];
}

const AddMetricModal: FC<Props> = ({
  isModalOpen,
  onClose,
  onConfirm,
  editingMetric,
  selectedTestSuite,
  dataset,
  metricDeclarations,
}) => {
  const t = useI18n();
  const prevSelectedMetricIdRef = useRef<string>(undefined);
  const attributeSamples = useAttributeSamples(dataset?.id, dataset?.testCaseSchema);

  const isEditMode = !!editingMetric;
  const [currentStepId, setCurrentStepId] = useState<string>(
    isEditMode ? MetricStep.Configuration : MetricStep.AddMetric,
  );

  const isMetricDeclarationsLoading = !metricDeclarations;
  const [isMetricDetailsLoading, setIsMetricDetailsLoading] = useState(false);

  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const [selectedMetricDetails, setSelectedMetricDetails] = useState<Metric | undefined>();

  const [metricName, setMetricName] = useState<string | undefined>('');
  const [condition, setCondition] = useState<string>('');

  const [metricColumnOrder, setMetricColumnOrder] = useState<string[]>([]);

  const [configBindings, setConfigBindings] = useState<MetricBinding[]>([]);
  const [inputBindings, setInputBindings] = useState<MetricBinding[]>([]);
  const [isJsonView, setIsJsonView] = useState(false);

  const selectedMetric = useMemo(
    () => metricDeclarations?.find((m) => m.id === selectedMetricId),
    [metricDeclarations, selectedMetricId],
  );

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

  // `condition` is only exposed on the plain list/detail item, not the aggregated schema call above.
  useEffect(() => {
    setCondition(editingMetric?.condition ?? '');
  }, [editingMetric?.condition]);

  const conditionError = isReservedSystemFunctionCondition(condition)
    ? t(TestSuitesI18nKey.ConditionSystemFunctionUnavailable)
    : undefined;

  const newMetricSelected =
    currentStepId === MetricStep.AddMetric && prevSelectedMetricIdRef.current !== selectedMetricId;

  const responseColumns = useMemo<ResponseColumn[]>(
    () => (selectedTestSuite ? getChainResponseColumns(selectedTestSuite) : []),
    [selectedTestSuite],
  );

  const isStep1Valid = !!selectedMetricId;
  const isStep2Valid =
    !conditionError &&
    !newMetricSelected &&
    (isJsonView
      ? true
      : validateMetricBindings(
          metricName,
          configBindings,
          inputBindings,
          selectedMetricDetails?.configSchema,
          selectedMetricDetails?.inputSchema,
        ) &&
        !hasInputTypeMismatch(
          inputBindings,
          selectedMetricDetails?.inputSchema,
          dataset?.testCaseSchema,
          responseColumns,
        ));

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
      onConfirm({
        ...generateMetricDefaultBindings(metricName ?? '', selectedMetricDetails, configBindings, inputBindings),
        condition: condition.trim() || undefined,
      });
    }
  }, [condition, configBindings, inputBindings, metricName, onConfirm, selectedMetricDetails]);

  const onMetricSelect = useCallback(
    (metricId: string) => {
      prevSelectedMetricIdRef.current = selectedMetricId;
      setSelectedMetricId(metricId);
    },
    [selectedMetricId],
  );

  const onStepChange = useCallback(
    (step: string) => {
      if (step === MetricStep.Configuration) prevSelectedMetricIdRef.current = selectedMetricId;
      setCurrentStepId(step);
    },
    [selectedMetricId],
  );

  return (
    <Popup
      onClose={onClose}
      header={isEditMode ? t(TestSuitesI18nKey.EditMetric) : t(TestSuitesI18nKey.AddMetric)}
      portalId="AddMetricModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      className="md:h-[800px] w-[1200px] max-w-[calc(100vw-2rem)]"
      headerDivider
      footerDivider
      footer={
        isEditMode ? (
          <div className="flex flex-row items-center gap-2 px-6 py-4 justify-end">
            <OutlinedButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
            <PrimaryButton label={t(ButtonsI18nKey.Confirm)} disabled={!isStep2Valid} onClick={onFinishClick} />
          </div>
        ) : (
          <StepperModalButtons
            steps={steps}
            currentStep={steps.find((s) => s.id === currentStepId)}
            onChangeStep={onStepChange}
            onFinishClick={onFinishClick}
            onClose={onClose}
          />
        )
      }
    >
      <div className="h-full flex flex-col min-h-0 px-6 py-4">
        {!isEditMode && <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={onStepChange} />}

        <div className={classNames('flex-1 min-h-0 overflow-auto', { 'mt-4': !isEditMode })}>
          {currentStepId === MetricStep.AddMetric && isMetricDeclarationsLoading && <Spinner size={44} fullWidth />}
          {currentStepId === MetricStep.Configuration && isMetricDetailsLoading && <Spinner size={44} fullWidth />}
          {currentStepId === MetricStep.AddMetric && !isMetricDeclarationsLoading && (
            <MetricSelection
              metrics={metricDeclarations || []}
              selectedMetricId={selectedMetricId}
              columnOrder={metricColumnOrder}
              onSelectMetric={onMetricSelect}
              onChangeColumnOrder={setMetricColumnOrder}
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
              samples={attributeSamples}
              selectedMetricDetails={selectedMetricDetails}
              onChangeConfigBindings={setConfigBindings}
              onChangeInputBindings={setInputBindings}
              onJsonViewChange={setIsJsonView}
              condition={condition}
              conditionError={conditionError}
              onChangeCondition={setCondition}
            />
          )}
        </div>
      </div>
    </Popup>
  );
};
export default AddMetricModal;
