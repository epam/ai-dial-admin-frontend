import classNames from 'classnames';

import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useCallback, useEffect, useState } from 'react';
import { IpRange, IpRangeError, IpRangeProperty, RestrictionType } from './types';
import {
  ButtonAppearance,
  DialNumberInputField,
  DialPrimaryButton,
  DialRadioButton,
  DialRemoveButton,
  DialTextInputField,
} from '@epam/ai-dial-ui-kit';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import Field from '@/src/components/Common/Field/Field';
import { IconPlus } from '@tabler/icons-react';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getIpAddressError, getIPMaskError } from '@/src/utils/validation/ip-error';

interface Props<T> {
  elementId?: string;
  entity: T;
  onChange?: (allowedIpAddressRanges?: string[]) => void;
}

const AccessRestrictionField = <T extends { allowedIpAddressRanges?: string[] }>({
  elementId,
  onChange,
  entity,
}: Props<T>) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const [selectedRadio, setSelectedRadio] = useState<RestrictionType>(() => {
    if (!entity.allowedIpAddressRanges) {
      return RestrictionType.ALLOW_ALL;
    } else if (entity.allowedIpAddressRanges.length === 0) {
      return RestrictionType.BLOCK_ALL;
    } else {
      return RestrictionType.RANGES;
    }
  });
  const [ipRanges, setIpRanges] = useState<IpRange[]>(() => {
    if (!entity.allowedIpAddressRanges || entity.allowedIpAddressRanges.length === 0) {
      return [];
    } else {
      return entity.allowedIpAddressRanges.map((range) => {
        const [ip, mask] = range.split('/');
        return {
          ip,
          mask: mask ? parseInt(mask) : undefined,
        };
      });
    }
  });
  const [errors, setErrors] = useState<IpRangeError[]>([]);

  const validateRanges = useCallback(
    (ranges: IpRange[]) => {
      let isRangesValid = true;
      const newErrors: IpRangeError[] = [];
      ranges.forEach((range) => {
        const ipError = range?.ip !== null ? getIpAddressError(range.ip, t, true) : null;
        const maskError = range?.mask !== null ? getIPMaskError(range.mask, t, true, 0, 24) : null;
        if (!range?.ip || !range?.mask || ipError || maskError) {
          isRangesValid = false;
        }
        const rangeError = {
          ip: ipError,
          mask: maskError,
        };
        newErrors.push(rangeError);
      });
      setErrors(newErrors);
      dispatch({ type: ValidationActionType.SetField, field: 'ipRanges', isValid: isRangesValid });
    },
    [t, dispatch],
  );

  const handleRadioChange = useCallback(
    (option: RestrictionType) => {
      setSelectedRadio(option);

      if (option === RestrictionType.ALLOW_ALL) {
        dispatch({ type: ValidationActionType.SetField, field: 'ipRanges', isValid: true });
      } else if (option === RestrictionType.BLOCK_ALL) {
        dispatch({ type: ValidationActionType.SetField, field: 'ipRanges', isValid: true });
      } else if (option === RestrictionType.RANGES) {
        validateRanges(ipRanges);
      }
    },
    [dispatch, ipRanges, validateRanges],
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
    validateRanges(ipRanges);
  }, [validateRanges, ipRanges]);

  useEffect(() => {
    if (selectedRadio === RestrictionType.ALLOW_ALL) {
      onChange?.(undefined);
    } else if (selectedRadio === RestrictionType.BLOCK_ALL) {
      onChange?.([]);
    } else if (selectedRadio === RestrictionType.RANGES) {
      const rangesArray = ipRanges.map((range) => `${range.ip}/${range.mask}`);
      onChange?.(rangesArray);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRadio, ipRanges]);

  return (
    <div className="flex flex-col w-full relative gap-2">
      <Field fieldTitle={t(KeysI18nKey.RestrictionFieldLabel)} htmlFor={elementId} />

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
        <div className={classNames('flex flex-col gap-2 pl-6 pt-2', STANDARD_CONTROL_WIDTH)}>
          {ipRanges.map((range, index) => (
            <div key={index} className="flex flex-row gap-1 items-start">
              <DialTextInputField
                containerClassName="flex w-full flex-1"
                label={index === 0 ? t(EntityFieldsI18nKey.IpRange) : null}
                placeholder={t(EntityPlaceholdersI18nKey.IpRange)}
                elementId={`ip-${index}`}
                onChange={(value) => {
                  handleUpdateRange(IpRangeProperty.IP, value, index);
                }}
                invalid={!!errors?.[index]?.ip}
                errorText={errors?.[index]?.ip?.text}
                value={range.ip || ''}
              />
              <span className={classNames('text-secondary leading-[40px]', index === 0 && 'mt-6')}>/</span>
              <DialNumberInputField
                elementId={`mask-${index}`}
                value={range.mask || undefined}
                fieldTitle={index === 0 ? t(EntityFieldsI18nKey.Mask) : undefined}
                containerClassName="w-[120px]"
                elementClassName="h-[40px]"
                placeholder={t(EntityPlaceholdersI18nKey.Mask)}
                onChange={(value) => {
                  handleUpdateRange(IpRangeProperty.MASK, value, index);
                }}
                invalid={!!errors?.[index]?.mask}
                errorText={errors?.[index]?.mask?.text}
              />
              <DialRemoveButton
                className={classNames(index === 0 && 'mt-6')}
                onClick={() => {
                  handleRemoveRange(index);
                }}
              />
            </div>
          ))}
          <DialPrimaryButton
            className="w-fit"
            appearance={ButtonAppearance.Link}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            label={t(ButtonsI18nKey.Add)}
            onClick={handleAddRange}
          />
        </div>
      )}
    </div>
  );
};

export default AccessRestrictionField;
