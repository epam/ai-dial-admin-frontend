import { MOUNT_TYPE } from '@/src/types/deployments/variables';

export const toBase64Value = (value: string) => {
  return Buffer.from(value, 'utf-8').toString('base64');
};

export const getValueByMountType = (value: string, mountType: MOUNT_TYPE) => {
  if (mountType === MOUNT_TYPE.SECURE_FILE) {
    return toBase64Value(value);
  }
  return value;
};
