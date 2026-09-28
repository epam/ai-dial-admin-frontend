'use client';

import { useCallback, useState } from 'react';

import { DialFormPopup, DialLabel, DialNeutralButton, DialSwitch } from '@epam/ai-dial-ui-kit';

import {
  modelResourceFeatureLabelMap,
  modelResourceFeaturePlaceholderMap,
  modelResourceSwitchGroups,
  modelResourceTextFeatures,
} from '@/src/components/Assets/Platform/Models/constants';
import {
  resourceFeatureLabelMap,
  resourceFeaturePlaceholderMap,
  resourceSwitchGroups,
  resourceTextFeatures,
} from '@/src/components/Assets/Resources/constants';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import ReasoningEffortsInput from '@/src/components/EntityTabs/Features/ReasoningEffortsInput';
import { ButtonsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  fieldId: string;
  features?: Record<string, unknown>;
  disabled?: boolean;
  view?: ApplicationRoute;
  onChange: (features: Record<string, unknown>) => void;
}

// Per-interface peer of the entity-level Features tab, reusing the same field set/grouping the asset
// Features editors (ModelResourceFeatures/ResourceFeatures) render — DialResourceFeatures is the shape
// common to both, so this popup works for either surface rather than importing one of those two
// resource-specific components.
const InterfaceFeaturesButton = ({ fieldId, features, disabled, onChange, view }: Props) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const isPlatformModel = view === ApplicationRoute.PlatformModels;
  const textFeatures = isPlatformModel ? modelResourceTextFeatures : resourceTextFeatures;
  const switchGroups = isPlatformModel ? modelResourceSwitchGroups : resourceSwitchGroups;
  const featureLabelMap: Record<string, FeaturesI18nKey> = isPlatformModel
    ? modelResourceFeatureLabelMap
    : resourceFeatureLabelMap;
  const featurePlaceholderMap = isPlatformModel ? modelResourceFeaturePlaceholderMap : resourceFeaturePlaceholderMap;

  const onOpen = useCallback(() => {
    setDraft(features || {});
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
          {textFeatures.map((key) => (
            <EndpointControl
              key={key}
              id={`${fieldId}-${key}`}
              label={t(featureLabelMap[key])}
              placeholder={t(featurePlaceholderMap[key])}
              endpoint={draft[key] as string}
              onChange={(value) => setDraft((prev) => ({ ...prev, [key]: value }))}
            />
          ))}
          <ReasoningEffortsInput
            values={draft.reasoning_efforts as string[] | undefined}
            onChange={(values) => setDraft((prev) => ({ ...prev, reasoning_efforts: values }))}
          />
          {switchGroups.map(({ title, keys }) => (
            <div key={title} className="flex flex-col gap-y-3">
              <DialLabel label={t(title)} />
              {keys.map((key) => (
                <DialSwitch
                  key={key}
                  isOn={!!draft[key]}
                  label={t(featureLabelMap[key])}
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
