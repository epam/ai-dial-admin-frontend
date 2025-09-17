import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModelProperties from '../ModelProperties';
import { ApplicationRoute } from '@/src/types/routes';

const mockUpdateModel = vi.fn();
const baseModel = {
  name: 'model-1',
  displayName: 'Test Model',
  fieldsHashingOrder: ['field1', 'field2'],
};

describe('ModelProperties', () => {
  beforeEach(() => {
    mockUpdateModel.mockClear();
  });

  it('renders all main subcomponents', () => {
    render(
      <ModelProperties
        model={baseModel as any}
        modelsNames={['Test Model', 'Other Model']}
        updateModel={mockUpdateModel}
      />,
    );
    // EntityMainProperties
    expect(screen.getByDisplayValue('Test Model')).toBeInTheDocument();
    // ForwardAuthTokenField
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
  });
});
