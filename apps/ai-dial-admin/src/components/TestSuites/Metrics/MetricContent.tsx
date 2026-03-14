'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialInput, DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import Bindings from './Bindings';
import Results from './Results';

interface Props {
  selectedTestSuite: TestSuite;
  metric: Metric;
  onDelete: () => void;
  onUpdate: (metric: Metric) => void;
}

const MetricContent: FC<Props> = ({ metric, selectedTestSuite, onDelete, onUpdate }) => {
  const t = useI18n();
  const [originalMetric, setOriginalMetric] = useState<Metric>(metric);
  const [selectedMetric, setSelectedMetric] = useState<Metric>(structuredClone(metric));

  const [isChanged, setIsChanged] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);

  const onChangeName = useCallback(
    (name?: string) => {
      setSelectedMetric({ ...metric, name: name || '' });
    },
    [metric],
  );

  const onSave = useCallback(() => {
    setIsSkipRefresh(false);
    onUpdate(selectedMetric);
  }, [onUpdate, selectedMetric]);

  const onDiscard = useCallback(() => {
    setSelectedMetric(originalMetric);
  }, [originalMetric]);

  const onChangeBinding = useCallback((metric: Metric, isSkipRefresh?: boolean) => {
    setIsSkipRefresh(!!isSkipRefresh);
    setSelectedMetric(metric);
  }, []);

  useEffect(() => {
    setOriginalMetric(metric);
    setSelectedMetric(structuredClone(metric));
  }, [metric]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalMetric, selectedMetric));
  }, [originalMetric, selectedMetric]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-row justify-between items-center">
        <DialInput
          containerClassName={STANDARD_CONTROL_WIDTH}
          id="metricName"
          value={selectedMetric?.name}
          onChange={onChangeName}
        />
        {isChanged ? (
          <div className="flex flex-row gap-3">
            <DialNeutralButton label={t(ButtonsI18nKey.Discard)} onClick={onDiscard} />
            <DialPrimaryButton label={t(ButtonsI18nKey.Save)} onClick={onSave} />
          </div>
        ) : (
          <DialNeutralButton
            label={t(ButtonsI18nKey.Delete)}
            iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onDelete}
          />
        )}
      </div>
      <span className="text-secondary dial-tiny block">{metric.metricDeclarationVersion?.description}</span>
      <Bindings
        selectedTestSuite={selectedTestSuite}
        selectedMetric={selectedMetric}
        onChange={onChangeBinding}
        isSkipRefresh={isSkipRefresh}
      />
      <Results selectedMetric={selectedMetric} />
    </div>
  );
};

export default MetricContent;
