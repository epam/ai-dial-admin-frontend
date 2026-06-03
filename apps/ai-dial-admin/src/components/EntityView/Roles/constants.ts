import { RolesI18nKey } from '@/src/constants/i18n';

const limitValueFormatter = (value: string) => {
  if (value === '') {
    return '';
  }
  let digits = value.replace(/\D/g, '');
  if (digits.length > 1) {
    digits = digits.replace(/^0+/, '');
    if (digits === '') {
      return '0';
    }
  }
  return digits;
};

export const cellRenderParams = {
  placeholder: RolesI18nKey.NotSpecified,
  valueFormatter: limitValueFormatter,
  inputType: 'text',
  inputMode: 'numeric',
};
