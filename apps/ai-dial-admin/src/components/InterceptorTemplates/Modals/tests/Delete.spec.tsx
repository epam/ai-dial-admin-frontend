import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('@/src/app/[lang]/interceptors/actions', () => ({
  getInterceptorsList: vi.fn().mockResolvedValue([{ name: 'interceptor-1' }]),
}));

import Delete from '../Delete';

describe('Delete InterceptorTemplate Modal', () => {
  test('Should render all important elements', async () => {
    render(<Delete template={{ name: 'test-template', displayName: '', description: '' }} />);

    expect(screen.getByText('DeleteEntity.Confirming')).toBeInTheDocument();
    expect(screen.getByText('test-template')).toBeInTheDocument();
    expect(screen.getByText('DeleteEntity.InterceptorTemplate.Title?')).toBeInTheDocument();
  });

  test('renders Grid when template interceptors match getInterceptorsList result', async () => {
    render(
      <Delete
        template={{
          name: 'template-with-interceptor',
          displayName: '',
          description: '',
          interceptors: ['interceptor-1'],
        }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
