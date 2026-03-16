'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import {
  DialLoader,
  DialNeutralButton,
  DialNoDataContent,
  DialPopup,
  DialPrimaryButton,
  DialTag,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { getMetricLatestVersion } from '@/src/app/[lang]/test-suites/actions';
import { jsonSchemaToFields, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import Search from '@/src/components/Common/Search/Search';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';

interface Props {
  isModalOpen: boolean;
  metrics: Metric[];
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

const AddMetricModal: FC<Props> = ({ isModalOpen, metrics, onClose, onConfirm }) => {
  const t = useI18n();
  const [pattern, setPattern] = useState<string>('');
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [selectedMetricId, setSelectedMetricId] = useState<string | undefined>();
  const [selectedMetricDetails, setSelectedMetricDetails] = useState<Metric | null>();

  const selectedMetricName = useMemo(() => {
    return metrics.find((metric) => metric.id === selectedMetricId)?.name;
  }, [metrics, selectedMetricId]);

  const selectedMetricParameters = useMemo(() => {
    return jsonSchemaToFields(selectedMetricDetails?.configSchema, selectedMetricDetails?.configSchema);
  }, [selectedMetricDetails]);
  const selectedMetricInputs = useMemo(() => {
    return jsonSchemaToFields(selectedMetricDetails?.inputSchema, selectedMetricDetails?.inputSchema);
  }, [selectedMetricDetails]);
  const selectedMetricOutputs = useMemo(() => {
    return jsonSchemaToFields(selectedMetricDetails?.outputSchema, selectedMetricDetails?.outputSchema);
  }, [selectedMetricDetails]);

  const filteredMetrics = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    return metrics?.filter((metric) => metric?.name?.toLowerCase().includes(patternLower)) || [];
  }, [metrics, pattern]);

  useEffect(() => {
    if (selectedMetricId) {
      setIsDetailsLoading(true);
      getMetricLatestVersion(selectedMetricId || '').then((metric) => {
        setSelectedMetricDetails(metric);
        setIsDetailsLoading(false);
      });
    }
  }, [selectedMetricId]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.AddMetric)}
      portalId="AddMetricModal"
      open={isModalOpen}
      size={PopupSize.Md}
      className="h-[800px]"
      dividers
      footer={
        <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialPrimaryButton
            label={t(ButtonsI18nKey.Confirm)}
            onClick={() =>
              onConfirm({
                name: selectedMetricName,
                metricDeclarationId: selectedMetricDetails?.metricDeclarationId,
                metricDeclarationVersionId: selectedMetricDetails?.id,
              })
            }
            disabled={!selectedMetricId}
          />
        </div>
      }
    >
      <div className="h-full px-6 py-4 flex flex-row gap-2 flex-1 min-h-0">
        <div className="flex flex-col gap-2 border border-primary p-4 w-1/2">
          <Search onChange={(search) => setPattern(search)} />
          {filteredMetrics.length ? (
            <div className="flex flex-col gap-2 min-h-0 overflow-auto">
              {filteredMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className={classNames(
                    'border border-primary rounded flex flex-col gap-2 p-4 hover:bg-accent-primary-alpha hover:border-accent-primary',
                    metric.id === selectedMetricId && 'bg-accent-primary-alpha border-accent-primary',
                  )}
                  onClick={() => {
                    if (metric.id !== selectedMetricId) {
                      setSelectedMetricId(metric.id);
                    }
                  }}
                >
                  <h3>{metric.name}</h3>
                  <span className="tiny text-secondary">{metric.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-primary p-4 w-full overflow-auto">
              <DialNoDataContent title={t(TestSuitesI18nKey.SelectMetricPreview)} />
            </div>
          )}
        </div>
        <div className="flex flex-col min-h-0 border border-primary p-4 w-1/2">
          {isDetailsLoading ? (
            <DialLoader size={40} />
          ) : selectedMetricDetails ? (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex flex-col gap-1 shrink-0">
                <h2>{selectedMetricName}</h2>
                <p className="tiny text-secondary">{selectedMetricDetails?.description}</p>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-auto">
                <MetricSchemaSection title={t(TestSuitesI18nKey.Parameters)} fields={selectedMetricParameters} />
                <MetricSchemaSection title={t(TestSuitesI18nKey.Inputs)} fields={selectedMetricInputs} />
                <MetricSchemaSection title={t(TestSuitesI18nKey.Outputs)} fields={selectedMetricOutputs} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DialPopup>
  );
};
export default AddMetricModal;
