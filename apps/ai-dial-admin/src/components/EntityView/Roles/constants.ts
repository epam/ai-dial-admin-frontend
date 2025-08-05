import { NO_LIMITS_KEY } from '@/src/constants/role';

const limitValueFormatter = (value: string) => {
  if (/^\d*$/.test(value)) {
    return value;
  }
};

export const cellRenderParams = {
  placeholder: NO_LIMITS_KEY,
  valueFormatter: limitValueFormatter,
  inputType: 'number',
};
