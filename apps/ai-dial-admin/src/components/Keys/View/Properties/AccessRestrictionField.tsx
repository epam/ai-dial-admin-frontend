import { useCallback, useEffect, useState } from 'react';

import { DialLabel, DialRadioButton, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { KeysI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import RangeItems from './RangeItems';
import { IpRange, IpRangeProperty, RestrictionType } from './types';

const INFO_ICON_SIZE = 16;

interface Props<T> {
  elementId?: string;
  entity: T;
  originalEntity?: T;
  onChange?: (allowedIpAddressRanges?: string[]) => void;
  disabled?: boolean;
  /**
   * Shows a tooltip next to the "Only selected ranges" option explaining that Core normalizes a
   * range to its network address on save (host bits outside the prefix are dropped). Asset keys
   * only — the legacy entity-key surface stores the raw CIDR and doesn't mask, so the notice would
   * be misleading there.
   */
  showMaskNotice?: boolean;
}

const AccessRestrictionField = <T extends { allowedIpAddressRanges?: string[] | null }>({
  elementId,
  onChange,
  entity,
  originalEntity,
  disabled,
  showMaskNotice,
}: Props<T>) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [selectedRadio, setSelectedRadio] = useState<RestrictionType>(RestrictionType.ALLOW_ALL);
  const [ipRanges, setIpRanges] = useState<IpRange[]>([]);

  const initialize = useCallback((entity: T) => {
    // Core serializes a null `IpAddressRanges` as JSON `null` (no restriction configured), and the
    // `IpAddressRanges` bean form is not a `string[]` — treat either as "allow all" rather than
    // crashing on `.length`/`.map`. Only a real array of CIDR strings reaches the RANGES branch.
    const ranges = entity.allowedIpAddressRanges;
    if (!ranges || !Array.isArray(ranges)) {
      setSelectedRadio(RestrictionType.ALLOW_ALL);
      setIpRanges([]);
    } else if (ranges.length === 0) {
      setSelectedRadio(RestrictionType.BLOCK_ALL);
      setIpRanges([]);
    } else {
      setSelectedRadio(RestrictionType.RANGES);
      const parsedRanges = ranges.map((range) => {
        const [ip, mask] = range.split('/');
        return {
          ip,
          mask: mask ? parseInt(mask) : undefined,
        };
      });
      setIpRanges(parsedRanges);
    }
  }, []);

  useEffect(() => {
    // On mount and whenever `originalEntity` changes (post-save refresh: Core returns masked
    // ranges that replace the original), reinitialize from the original — it is the authoritative
    // saved value, and reading it here avoids the race where `entity` (a clone the parent updates
    // in a separate effect) is still the pre-refresh value on this render.
    initialize(originalEntity ?? entity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalEntity]);

  const handleRadioChange = useCallback(
    (option: RestrictionType) => {
      setSelectedRadio(option);

      if (option === RestrictionType.ALLOW_ALL) {
        setIpRanges([]);
        dispatch({ type: ValidationActionType.SetField, field: 'ipRanges', isValid: true });
      } else if (option === RestrictionType.BLOCK_ALL) {
        setIpRanges([]);
        dispatch({ type: ValidationActionType.SetField, field: 'ipRanges', isValid: true });
      }
    },
    [dispatch],
  );

  const handleAddRange = useCallback(() => {
    setIpRanges([...ipRanges, { ip: null, mask: null }]);
  }, [ipRanges]);

  const handleRemoveRange = useCallback(
    (index: number) => {
      const newIpRanges = structuredClone(ipRanges);
      newIpRanges.splice(index, 1);

      setIpRanges(newIpRanges);
    },
    [ipRanges],
  );

  const handleUpdateRange = useCallback(
    (property: IpRangeProperty, value: string | number | undefined, index: number) => {
      const newIpRanges = structuredClone(ipRanges);
      const targetRange = newIpRanges[index];
      if (property === IpRangeProperty.IP) {
        targetRange.ip = value ? value.toString() : undefined;
      } else if (property === IpRangeProperty.MASK) {
        targetRange.mask = value ? +value : undefined;
      }

      setIpRanges(newIpRanges);
    },
    [ipRanges],
  );

  useEffect(() => {
    if (selectedRadio === RestrictionType.ALLOW_ALL) {
      onChange?.();
    } else if (selectedRadio === RestrictionType.BLOCK_ALL) {
      onChange?.([]);
    } else if (selectedRadio === RestrictionType.RANGES) {
      const rangesArray = ipRanges.map((range) => `${range.ip}/${range.mask}`);
      onChange?.(rangesArray);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRadio, ipRanges]);

  useEffect(() => {
    // Reinitialize when the entity is reset back to the original (discard), or when the original
    // itself changes (post-save refresh: Core returns masked ranges that replace `originalEntity`,
    // and the parent clones it into `entity`). The referential equality check distinguishes a
    // server/discard reset from an in-progress user edit, which must NOT reinit (it would wipe the
    // fields the user is typing into).
    if (entity === originalEntity) {
      initialize(entity);
    }
  }, [entity, originalEntity, initialize]);

  return (
    <div className="flex flex-col w-full relative gap-1">
      <DialLabel label={t(KeysI18nKey.RestrictionFieldLabel)} htmlFor={elementId} />

      <div className="flex flex-col gap-4">
        <DialRadioButton
          inputId={`${elementId}-allow-all`}
          name={`${elementId}-restriction-options`}
          value={RestrictionType.ALLOW_ALL}
          checked={selectedRadio === RestrictionType.ALLOW_ALL}
          onChange={() => handleRadioChange(RestrictionType.ALLOW_ALL)}
          label={t(KeysI18nKey.AllowAllRestriction)}
          disabled={disabled}
        />

        <DialRadioButton
          inputId={`${elementId}-block-all`}
          name={`${elementId}-restriction-options`}
          value={RestrictionType.BLOCK_ALL}
          checked={selectedRadio === RestrictionType.BLOCK_ALL}
          onChange={() => handleRadioChange(RestrictionType.BLOCK_ALL)}
          label={t(KeysI18nKey.BlockAllRestriction)}
          disabled={disabled}
        />

        <div className="flex items-center gap-1">
          <DialRadioButton
            inputId={`${elementId}-ranges`}
            name={`${elementId}-restriction-options`}
            value={RestrictionType.RANGES}
            checked={selectedRadio === RestrictionType.RANGES}
            onChange={() => handleRadioChange(RestrictionType.RANGES)}
            label={t(KeysI18nKey.RangesRestriction)}
            disabled={disabled}
          />
          {showMaskNotice && (
            <DialTooltip
              tooltip={<span>{t(KeysI18nKey.IpRangesMaskNotice)}</span>}
              triggerClassName="flex items-center"
            >
              <button
                type="button"
                aria-label={t(KeysI18nKey.IpRangesMaskNotice)}
                className="flex shrink-0 items-center text-secondary hover:text-accent-primary focus-visible:text-accent-primary"
              >
                <IconInfoCircle size={INFO_ICON_SIZE} aria-hidden />
              </button>
            </DialTooltip>
          )}
        </div>
      </div>

      {selectedRadio === RestrictionType.RANGES && (
        <RangeItems
          ranges={ipRanges}
          onAddRange={handleAddRange}
          onUpdateRange={handleUpdateRange}
          onRemoveRange={handleRemoveRange}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default AccessRestrictionField;
