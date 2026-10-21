import { APPLICATION_ZIP_TYPES } from '@/src/constants/request-headers';

export const TEST_CASES_IMPORT_ACCEPT_TYPES = ['text/csv', ...APPLICATION_ZIP_TYPES].join(', ');
