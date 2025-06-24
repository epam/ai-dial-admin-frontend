import { render } from '@testing-library/react';
import AdapterSelector from './AdapterSelector';
import { adaptersMock } from '@/src/utils/tests/mock/models.mock';
import { describe, expect, test, vi } from 'vitest';

const mockFunction = vi.fn();

describe('Properties - AdapterSelector', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <AdapterSelector onChangeAdapter={mockFunction} adapters={adaptersMock} model={{}} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
