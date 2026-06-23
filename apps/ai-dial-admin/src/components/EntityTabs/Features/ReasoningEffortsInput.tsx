import { FC, useCallback, useMemo } from 'react';

import { DialLabel } from '@epam/ai-dial-ui-kit';

import MultiValueAutocomplete, {
  MultiValueOption,
} from '@/src/components/Common/MultiValueAutocomplete/MultiValueAutocomplete';
import { EntityPlaceholdersI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { REASONING_EFFORTS_OPTIONS } from './constants';

interface Props {
  values?: string[];
  onChange: (values: string[]) => void;
}

const ReasoningEffortsInput: FC<Props> = ({ values, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const selected = useMemo<MultiValueOption[]>(
    () => (values ?? []).map((v) => REASONING_EFFORTS_OPTIONS.find((o) => o.value === v) || { label: v, value: v }),
    [values],
  );

  const handleAdd = useCallback(
    (item: MultiValueOption) => onChange([...(values ?? []), item.value]),
    [values, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => onChange((values ?? []).filter((_, i) => i !== index)),
    [values, onChange],
  );

  return (
    <div className="flex flex-col gap-y-1">
      <DialLabel label={t(FeaturesI18nKey.reasoningEfforts)} />
      <MultiValueAutocomplete
        selected={selected}
        availableItems={REASONING_EFFORTS_OPTIONS}
        placeholder={t(EntityPlaceholdersI18nKey.ReasoningEfforts)}
        isReadOnlyAdmin={isReadOnlyAdmin}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
};

export default ReasoningEffortsInput;
