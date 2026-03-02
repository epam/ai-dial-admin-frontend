import classNames from 'classnames';

import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { FC, useCallback, useEffect, useState } from 'react';
import { IpRange, IpRangeError, IpRangeProperty } from './types';
import {
  ButtonAppearance,
  DialNumberInputField,
  DialPrimaryButton,
  DialRemoveButton,
  DialTextInputField,
} from '@epam/ai-dial-ui-kit';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { IconPlus } from '@tabler/icons-react';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { getIpAddressError, getIPMaskError } from '@/src/utils/validation/ip-error';

interface Props {
  ranges: IpRange[];
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onUpdateRange: (property: IpRangeProperty, value: string | number | undefined, index: number) => void;
}

const RangeItems: FC<Props> = ({ ranges, onAddRange, onRemoveRange, onUpdateRange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
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
      dispatch({
        type: ValidationActionType.SetField,
        field: 'ipRanges',
        isValid: ranges.length > 0 ? isRangesValid : false,
      });
    },
    [t, dispatch],
  );

  useEffect(() => {
    validateRanges(ranges);
  }, [validateRanges, ranges]);

  return (
    <div className={classNames('flex flex-col gap-2 pl-6 pt-2', STANDARD_CONTROL_WIDTH)}>
      {ranges.map((range, index) => (
        <div key={index} className="flex flex-row gap-1 items-start">
          <DialTextInputField
            containerClassName="flex w-full flex-1"
            label={index === 0 ? t(EntityFieldsI18nKey.IpRange) : null}
            placeholder={t(EntityPlaceholdersI18nKey.IpRange)}
            elementId={`ip-${index}`}
            onChange={(value) => {
              onUpdateRange(IpRangeProperty.IP, value, index);
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
              onUpdateRange(IpRangeProperty.MASK, value, index);
            }}
            invalid={!!errors?.[index]?.mask}
            errorText={errors?.[index]?.mask?.text}
          />
          <DialRemoveButton
            className={classNames(index === 0 && 'mt-6')}
            onClick={() => {
              onRemoveRange(index);
            }}
          />
        </div>
      ))}
      <DialPrimaryButton
        className="w-fit mt-2"
        appearance={ButtonAppearance.Link}
        iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
        label={t(ButtonsI18nKey.Add)}
        onClick={onAddRange}
      />
    </div>
  );
};

export default RangeItems;
