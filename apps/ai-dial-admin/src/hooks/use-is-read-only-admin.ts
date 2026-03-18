import { useAppContext } from '@/src/context/AppContext';

export const useIsReadOnlyAdmin = (): boolean => useAppContext().isReadOnlyAdmin;
