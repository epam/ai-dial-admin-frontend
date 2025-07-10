import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import Delete from '../Delete';

describe('Delete InterceptorTemplate Modal', () => {
  test('Should render all important elements', async () => {
    render(<Delete template={{ name: 'test-template', displayName: '', description: '' }} />);

    expect(screen.getByText('DeleteEntity.Confirming')).toBeInTheDocument();
    expect(screen.getByText('test-template')).toBeInTheDocument();
    expect(screen.getByText('DeleteEntity.InterceptorTemplate.Title?')).toBeInTheDocument();
  });
});
