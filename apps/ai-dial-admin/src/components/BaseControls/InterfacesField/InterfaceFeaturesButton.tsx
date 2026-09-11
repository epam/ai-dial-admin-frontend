'use client';

import { useCallback, useState } from 'react';

import { DialFormPopup, DialLabel, DialNeutralButton, DialSwitch } from '@epam/ai-dial-ui-kit';

import {
  resourceFeatureLabelMap,
  resourceFeaturePlaceholderMap,
  resourceSwitchGroups,
  resourceTextFeatures,
} from '@/src/components/Assets/Resources/constants';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ReasoningEffortsInput from '@/src/components/EntityTabs/Features/ReasoningEffortsInput';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationResourceFeatures } from '@/src/models/dial/resource';

interface Props {
  fieldId: string;
  features?: Record<string, unknown>;
  disabled?: boolean;
  onChange: (features: Record<string, unknown>) => void;
}

// Per-interface peer of the entity-level Features tab, reusing the same field set/grouping the asset
// Features editors (ModelResourceFeatures/ResourceFeatures) render — DialResourceFeatures is the shape
// common to both, so this popup works for either surface rather than importing one of those two
// resource-specific components.
const InterfaceFeaturesButton = ({ fieldId, features, disabled, onChange }: Props) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<DialApplicationResourceFeatures>({} as DialApplicationResourceFeatures);

  const onOpen = useCallback(() => {
    setDraft((features || {}) as unknown as DialApplicationResourceFeatures);
    setIsOpen(true);
  }, [features]);

  const onCancel = useCallback(() => setIsOpen(false), []);

  const onApply = useCallback(() => {
    onChange(draft as unknown as Record<string, unknown>);
    setIsOpen(false);
  }, [draft, onChange]);

  return (
    <>
      <DialNeutralButton label={t(ButtonsI18nKey.Features)} onClick={onOpen} disabled={disabled || isReadOnlyAdmin} />
      <DialFormPopup
        onClose={onCancel}
        header={t(ButtonsI18nKey.Features)}
        portalId={`${fieldId}-features-modal`}
        open={isOpen}
        submitLabel={t(ButtonsI18nKey.Apply)}
        onSubmit={onApply}
        cancelLabel={t(ButtonsI18nKey.Cancel)}
        onCancel={onCancel}
      >
        <div className="px-6 py-4 flex flex-col gap-y-8 max-h-[60vh] overflow-auto">
          {resourceTextFeatures.map((key) => (
            <EndpointControl
              key={key}
              id={`${fieldId}-${key}`}
              label={t(resourceFeatureLabelMap[key])}
              placeholder={t(resourceFeaturePlaceholderMap[key])}
              endpoint={draft[key] as string}
              onChange={(value) => setDraft((prev) => ({ ...prev, [key]: value }))}
            />
          ))}
          <ReasoningEffortsInput
            values={draft.reasoning_efforts}
            onChange={(values) => setDraft((prev) => ({ ...prev, reasoning_efforts: values }))}
          />
          {resourceSwitchGroups.map(({ title, keys }) => (
            <div key={title} className="flex flex-col gap-y-3">
              <DialLabel label={t(title)} />
              {keys.map((key) => (
                <DialSwitch
                  key={key}
                  isOn={!!draft[key]}
                  label={t(resourceFeatureLabelMap[key])}
                  switchId={`${fieldId}-${key}`}
                  onChange={(value) => setDraft((prev) => ({ ...prev, [key]: value }))}
                />
              ))}
            </div>
          ))}
        </div>
      </DialFormPopup>
    </>
  );
};

export default InterfaceFeaturesButton;
