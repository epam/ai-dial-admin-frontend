'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { BindingSourceValue } from '@/src/models/evaluation/metric';

interface Props {
  value: unknown;
  onChange: (value: BindingSourceValue) => void;
}

const EMPTY_OBJECT_JSON = '{}';

const toEditorText = (value: unknown): string => {
  if (value == null || value === '') {
    return EMPTY_OBJECT_JSON;
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return EMPTY_OBJECT_JSON;
  }
};

/**
 * Inline JSON editor for plain-object constant metric bindings (Figma Object Empty/Filled).
 * Keeps a local draft so invalid JSON is not pushed upstream.
 */
const MetricObjectConstantInput: FC<Props> = ({ value, onChange }) => {
  const [draft, setDraft] = useState(() => toEditorText(value));

  useEffect(() => {
    setDraft(toEditorText(value));
  }, [value]);

  const onEditorChange = useCallback(
    (next: string | undefined) => {
      const text = next ?? '';
      setDraft(text);
      try {
        const parsed = JSON.parse(text) as BindingSourceValue;
        onChange(parsed);
      } catch {
        // Keep draft; do not push invalid JSON.
      }
    },
    [onChange],
  );

  return (
    <div className="min-h-[100px] h-[120px] w-full overflow-hidden rounded border border-secondary">
      <JsonEditorBase value={draft} onChange={onEditorChange} language="json" />
    </div>
  );
};

export default MetricObjectConstantInput;
