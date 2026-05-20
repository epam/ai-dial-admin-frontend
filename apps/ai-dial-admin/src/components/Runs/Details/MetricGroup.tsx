'use client';

import { FC, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classNames from 'classnames';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { MetricBindingType } from '@/src/types/evaluation';
import { MetricGroup as MetricGroupModel } from '@/src/components/Runs/View/models';

import MetricCardsGrid from './MetricCardsGrid';
import MetricInfoPanel from './MetricInfoPanel';

interface Props {
  group: MetricGroupModel;
  configBindings?: MetricBinding[];
  inputBindings?: MetricBinding[];
}

const BINDING_CHIP_CLASSES: Record<MetricBindingType, string> = {
  [MetricBindingType.Constant]: 'text-success bg-success-alpha',
  [MetricBindingType.TestCase]: 'text-accent-secondary bg-accent-secondary-alpha',
  [MetricBindingType.Response]: 'text-accent-primary bg-accent-primary-alpha',
};

interface BindingsSectionProps {
  label: string;
  bindings: MetricBinding[];
  isExpanded: boolean;
  onToggle: () => void;
}

const BindingsSection: FC<BindingsSectionProps> = ({ label, bindings, isExpanded, onToggle }) => (
  <div className="flex flex-col gap-2">
    <button className="flex items-center gap-2 dial-small-semi text-left" onClick={onToggle}>
      {isExpanded ? (
        <IconChevronDown className="text-secondary shrink-0" {...BASE_BUTTON_ICON_PROPS} />
      ) : (
        <IconChevronRight className="text-secondary shrink-0" {...BASE_BUTTON_ICON_PROPS} />
      )}
      {label}
    </button>
    {isExpanded && (
      <div className="flex flex-col">
        {bindings.map((binding, i) => {
          const chipClass = BINDING_CHIP_CLASSES[binding.source.$type as MetricBindingType] ?? '';
          const value =
            binding.source.$type === MetricBindingType.Constant
              ? String(binding.source.value ?? '')
              : (binding.source.columnName ?? '');
          return (
            <div
              key={i}
              className="grid grid-cols-[minmax(70px,140px)_auto_1fr] gap-x-2 dial-tiny-text px-2 py-1.5 border-b border-tertiary last:border-b-0"
            >
              <span className="truncate">{binding.property}</span>
              <span
                className={classNames(
                  'inline-block text-[9px] font-semibold px-[5px] py-px rounded-sm uppercase tracking-wide leading-[14px]',
                  chipClass,
                )}
              >
                {binding.source.$type}
              </span>
              <span className="truncate">{value}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const MetricGroup: FC<Props> = ({ group, configBindings, inputBindings }) => {
  const t = useI18n();
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);
  const [isConfigBindingsExpanded, setIsConfigBindingsExpanded] = useState(false);
  const [isInputBindingsExpanded, setIsInputBindingsExpanded] = useState(false);

  const toggleMetric = useCallback((key: string) => {
    setSelectedMetricKey((prev) => (prev === key ? null : key));
  }, []);

  const toggleConfigBindings = useCallback(() => {
    setIsConfigBindingsExpanded((prev) => !prev);
  }, []);

  const toggleInputBindings = useCallback(() => {
    setIsInputBindingsExpanded((prev) => !prev);
  }, []);
  return (
    <section className="flex flex-col gap-3 border border-secondary rounded p-3">
      <div className={classNames('dial-small-semi', group.hasError && 'text-error')}>{group.title}</div>
      <MetricCardsGrid group={group} selectedMetricKey={selectedMetricKey ?? undefined} onMetricClick={toggleMetric} />
      {group.hasError && group.errorMessage && (
        <div className="grid grid-cols-[auto_1fr] gap-x-3 dial-tiny-text mt-1">
          <span className="text-error">error</span>
          <span className="text-error break-words">{group.errorMessage}</span>
        </div>
      )}
      {selectedMetricKey && !!group.info?.[selectedMetricKey] && (
        <MetricInfoPanel info={{ [selectedMetricKey]: group.info[selectedMetricKey] }} />
      )}
      {!!configBindings?.length && (
        <BindingsSection
          label={t(RunsI18nKey.ConfigBindings)}
          bindings={configBindings}
          isExpanded={isConfigBindingsExpanded}
          onToggle={toggleConfigBindings}
        />
      )}
      {!!inputBindings?.length && (
        <BindingsSection
          label={t(RunsI18nKey.InputBindings)}
          bindings={inputBindings}
          isExpanded={isInputBindingsExpanded}
          onToggle={toggleInputBindings}
        />
      )}
    </section>
  );
};

export default MetricGroup;
