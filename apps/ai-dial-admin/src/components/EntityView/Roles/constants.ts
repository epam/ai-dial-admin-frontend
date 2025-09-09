import { RolesI18nKey } from '@/src/constants/i18n';

export const NO_LIMITS_VALUE = '9223372036854775807';
export const NO_LIMITS_ACCEPTED_USERS = '2147483647';

const limitValueFormatter = (value: string) => {
  if (/^\d*$/.test(value)) {
    return value;
  }
};

export const cellRenderParams = {
  placeholder: RolesI18nKey.NoLimits,
  valueFormatter: limitValueFormatter,
  inputType: 'number',
};
