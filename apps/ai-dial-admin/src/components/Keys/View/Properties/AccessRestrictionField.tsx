import { KeysI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialLabel, DialRadioButton } from '@epam/ai-dial-ui-kit';
import { useCallback, useEffect, useState } from 'react';
import RangeItems from './RangeItems';
import { IpRange, IpRangeProperty, RestrictionType } from './types';

interface Props<T> {
  elementId?: string;
  entity: T;
  originalEntity?: T;
  onChange?: (allowedIpAddressRanges?: string[]) => void;
}

const AccessRestrictionField = <T extends { allowedIpAddressRanges?: string[] }>({
  elementId,
  onChange,
  entity,
  originalEntity,
}: Props<T>) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const [selectedRadio, setSelectedRadio] = useState<RestrictionType>(RestrictionType.ALLOW_ALL);
  const [ipRanges, setIpRanges] = useState<IpRange[]>([]);

  const initialize = useCallback((entity: T) => {
    if (!entity.allowedIpAddressRanges) {
      setSelectedRadio(RestrictionType.ALLOW_ALL);
      setIpRanges([]);
    } else if (entity.allowedIpAddressRanges.length === 0) {
      setSelectedRadio(RestrictionType.BLOCK_ALL);
      setIpRanges([]);
    } else {
      setSelectedRadio(RestrictionType.RANGES);
      const ranges = entity.allowedIpAddressRanges.map((range) => {
        const [ip, mask] = range.split('/');
        return {
          ip,
          mask: mask ? parseInt(mask) : undefined,
        };
      });
      setIpRanges(ranges);
    }
  }, []);

  useEffect(() => {
    initialize(entity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRadioChange = useCallback(
    (option: RestrictionType) => {
      setSelectedRadio(option);

      if (option === RestrictionType.ALLOW_ALL) {
        dispatch({ type: ValidationActionType.SetField, field: 'ipRanges', isValid: true });
      } else if (option === RestrictionType.BLOCK_ALL) {
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
    // When discard need to reinitialize Field
    if (entity === originalEntity) {
      initialize(entity);
    }
  }, [entity, originalEntity, initialize]);

  return (
    <div className="flex flex-col w-full relative gap-2">
      <DialLabel label={t(KeysI18nKey.RestrictionFieldLabel)} htmlFor={elementId} />

      <div className="flex flex-col gap-4">
        <DialRadioButton
          inputId={`${elementId}-allow-all`}
          name={`${elementId}-restriction-options`}
          value={RestrictionType.ALLOW_ALL}
          checked={selectedRadio === RestrictionType.ALLOW_ALL}
          onChange={() => handleRadioChange(RestrictionType.ALLOW_ALL)}
          label={t(KeysI18nKey.AllowAllRestriction)}
        />

        <DialRadioButton
          inputId={`${elementId}-block-all`}
          name={`${elementId}-restriction-options`}
          value={RestrictionType.BLOCK_ALL}
          checked={selectedRadio === RestrictionType.BLOCK_ALL}
          onChange={() => handleRadioChange(RestrictionType.BLOCK_ALL)}
          label={t(KeysI18nKey.BlockAllRestriction)}
        />

        <DialRadioButton
          inputId={`${elementId}-ranges`}
          name={`${elementId}-restriction-options`}
          value={RestrictionType.RANGES}
          checked={selectedRadio === RestrictionType.RANGES}
          onChange={() => handleRadioChange(RestrictionType.RANGES)}
          label={t(KeysI18nKey.RangesRestriction)}
        />
      </div>

      {selectedRadio === RestrictionType.RANGES && (
        <RangeItems
          ranges={ipRanges}
          onAddRange={handleAddRange}
          onUpdateRange={handleUpdateRange}
          onRemoveRange={handleRemoveRange}
        />
      )}
    </div>
  );
};

export default AccessRestrictionField;
