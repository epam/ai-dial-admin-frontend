import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';

import List from './List';

describe('Interceptor Templates List', () => {
  test('Should render correctly', () => {
    const data = [
      { name: 'a', displayName: 'A', description: '' },
      { name: 'b', displayName: 'B', description: '' },
    ];
    render(<List route={ApplicationRoute.InterceptorTemplates} data={data} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Menu.InterceptorTemplates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
