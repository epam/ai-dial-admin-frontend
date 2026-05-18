import { FC, useEffect, useState, type ReactNode } from 'react';

import {
  ButtonAppearance,
  DialInput,
  DialLabel,
  DialPrimaryButton,
  DialRemoveButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';

import { createEmptyField, SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';
import { IconPlus } from '@tabler/icons-react';

import MetricArrayControl, { NestedMetricFieldRenderProps } from './MetricArrayControl';
import { MetricBindingType } from '@/src/types/evaluation';

export interface MetricObjectMapControlProps {
  field: SchemaFieldRow;
  label?: boolean;
  binding?: MetricBinding;
  onChangeValue: (fieldId: string, value: BindingSourceValue) => void;
  renderNestedField: (props: NestedMetricFieldRenderProps) => ReactNode;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const defaultEmptyRowKey = (map: Record<string, unknown>): string => {
  let n = 0;
  let candidate = 'key';
  while (candidate in map) {
    candidate = `key_${++n}`;
  }
  return candidate;
};

const coerceMapFromBinding = (raw: unknown): Record<string, unknown[]> => {
  if (!isRecord(raw)) return {};
  const out: Record<string, unknown[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = Array.isArray(v) ? [...v] : [];
  }
  return out;
};

const valueArrayField = (parent: SchemaFieldRow, rowIndex: number): SchemaFieldRow => {
  const row = createEmptyField(parent.id, parent.depth + 1);
  return {
    ...row,
    id: `${parent.id}-map-row-${rowIndex}`,
    name: '__values',
    type: 'array',
    itemsType: parent.additionalPropertiesArrayItemType!,
    required: false,
    title: '',
    description: '',
  };
};

interface MapEntryRowProps {
  entryKey: string;
  rowIndex: number;
  field: SchemaFieldRow;
  map: Record<string, unknown[]>;
  keyPlaceholder: string;
  onRenameKey: (oldKey: string, newKey: string) => void;
  onChangeValues: (key: string, values: BindingSourceValue) => void;
  onRemoveEntry: (key: string) => void;
  renderNestedField: (props: NestedMetricFieldRenderProps) => ReactNode;
}

const MapEntryRow: FC<MapEntryRowProps> = ({
  entryKey,
  rowIndex,
  field,
  map,
  keyPlaceholder,
  onRenameKey,
  onChangeValues,
  onRemoveEntry,
  renderNestedField,
}) => {
  const [keyDraft, setKeyDraft] = useState(entryKey);

  useEffect(() => {
    setKeyDraft(entryKey);
  }, [entryKey]);

  const commitKeyOnBlur = () => {
    const trimmed = keyDraft.trim();
    if (!trimmed) {
      setKeyDraft(entryKey);
      return;
    }
    if (trimmed === entryKey) return;
    if (trimmed in map && trimmed !== entryKey) {
      setKeyDraft(entryKey);
      return;
    }
    onRenameKey(entryKey, trimmed);
  };

  return (
    <div className="flex flex-col gap-2 rounded border border-primary p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <DialInput
          id={`${field.id}-map-key-${rowIndex}`}
          placeholder={keyPlaceholder}
          value={keyDraft}
          onChange={(v) => setKeyDraft(v ?? '')}
          onBlur={commitKeyOnBlur}
        />
      </div>
      <div className="min-w-0 flex-[2]">
        <MetricArrayControl
          field={valueArrayField(field, rowIndex)}
          binding={{
            property: '__values',
            source: { $type: MetricBindingType.Constant, value: map[entryKey] as BindingSourceValue },
          }}
          label={false}
          onChangeValue={(_, v) => onChangeValues(entryKey, v)}
          renderNestedField={renderNestedField}
        />
      </div>
      <DialRemoveButton className="shrink-0" onClick={() => onRemoveEntry(entryKey)} />
    </div>
  );
};

const MetricObjectMapControl: FC<MetricObjectMapControlProps> = ({
  binding,
  field,
  label = true,
  onChangeValue,
  renderNestedField,
}) => {
  const t = useI18n();
  const map = coerceMapFromBinding(binding?.source.value);
  const entries = Object.entries(map);

  const commitMap = (next: Record<string, unknown[]>) => {
    onChangeValue(field.name, next as BindingSourceValue);
  };

  const onAddEntry = () => {
    const key = defaultEmptyRowKey(map);
    commitMap({ ...map, [key]: [] });
  };

  const onRemoveEntry = (key: string) => {
    const next = { ...map };
    delete next[key];
    commitMap(next);
  };

  const onChangeEntryKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    if (!(oldKey in map)) return;
    const val = map[oldKey]!;
    const next: Record<string, unknown[]> = {};
    for (const k of Object.keys(map)) {
      if (k === oldKey) {
        next[newKey] = val;
      } else {
        next[k] = map[k]!;
      }
    }
    commitMap(next);
  };

  const onChangeEntryValues = (key: string, values: BindingSourceValue) => {
    commitMap({ ...map, [key]: values as unknown[] });
  };

  return (
    <div className="flex flex-col gap-y-2">
      {label && (
        <DialLabel htmlFor={field.id} required={field.required} label={field.name} caption={field.description} />
      )}

      <div className="flex flex-col gap-2">
        {entries.map(([entryKey], rowIndex) => (
          <MapEntryRow
            key={entryKey}
            entryKey={entryKey}
            rowIndex={rowIndex}
            field={field}
            map={map}
            keyPlaceholder={t(EntityPlaceholdersI18nKey.UpstreamKey)}
            onRenameKey={onChangeEntryKey}
            onChangeValues={onChangeEntryValues}
            onRemoveEntry={onRemoveEntry}
            renderNestedField={renderNestedField}
          />
        ))}
      </div>

      <div>
        <DialPrimaryButton
          appearance={ButtonAppearance.Ghost}
          iconBefore={<IconPlus stroke={2} size={16} />}
          onClick={onAddEntry}
          size={ElementSize.Small}
          label={t(ButtonsI18nKey.Add)}
        />
      </div>
    </div>
  );
};

export default MetricObjectMapControl;
