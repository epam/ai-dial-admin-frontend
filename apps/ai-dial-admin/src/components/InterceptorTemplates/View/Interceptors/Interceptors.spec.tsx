import { describe, test, vi, expect, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';

import Interceptors from '@/src/components/InterceptorTemplates/View/Interceptors/Interceptors';
import { EntitiesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/interceptors/actions', () => ({
  getInterceptorsList: vi.fn(),
}));

const interceptors = [
  { name: 'Interceptor-1', description: 'Description 1' },
  { name: 'Interceptor-2', description: 'Description 2' },
];

describe('Interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render no data when interceptors list is empty', () => {
    render(<Interceptors interceptorList={[]} />);

    expect(screen.getByText(EntitiesI18nKey.NoInterceptors)).toBeInTheDocument();
  });

  test('should render no data when interceptors from BE', () => {
    (getInterceptorsList as Mock).mockResolvedValue([]);
    render(<Interceptors interceptorList={['name']} />);

    expect(screen.getByText(EntitiesI18nKey.NoInterceptors)).toBeInTheDocument();
  });

  test('should render grid with interceptors', async () => {
    (getInterceptorsList as Mock).mockResolvedValue({ success: true, response: interceptors });

    render(<Interceptors interceptorList={['Interceptor-1']} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
