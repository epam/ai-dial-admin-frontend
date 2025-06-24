import { render } from '@testing-library/react';
import AddEntitiesView from '../AddEntitiesView';
import { describe, expect, test, vi } from 'vitest';

const mockFunction = vi.fn();

const formatEntity = () => {
  return [];
};
describe('RolesView - Entities', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <AddEntitiesView
        addons={[]}
        applications={[]}
        models={[]}
        getRelevantDataForEntity={formatEntity}
        onAdd={mockFunction}
        onRemove={mockFunction}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
