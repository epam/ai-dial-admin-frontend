import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ModelProperties from '../ModelProperties';

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

  test('renders all main subcomponents', () => {
    render(
      <ModelProperties
        model={baseModel as any}
        modelsNames={['Test Model', 'Other Model']}
        onChangeModel={mockUpdateModel}
      />,
    );
    // EntityMainProperties
    expect(screen.getByDisplayValue('Test Model')).toBeInTheDocument();
    // ForwardAuthTokenField
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
  });
});
