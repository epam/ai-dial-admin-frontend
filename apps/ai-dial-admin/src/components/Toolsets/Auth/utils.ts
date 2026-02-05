import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';
import { isValueTruthy } from '@/src/utils/types';

const key = 'toolset-auth-is-user';

export const setIsUser = (type: ToolsetAuthCredentialLevel) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, String(type === ToolsetAuthCredentialLevel.USER));
  }
};

export const getIsUser = () => {
  const isUser = localStorage.getItem(key);
  localStorage.removeItem(key);
  return isValueTruthy(isUser);
};
