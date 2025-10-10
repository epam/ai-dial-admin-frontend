import { RolesI18nKey } from '@/src/constants/i18n';

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
