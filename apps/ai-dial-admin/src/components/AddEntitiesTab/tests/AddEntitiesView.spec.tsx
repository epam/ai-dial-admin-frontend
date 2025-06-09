import { render } from '@testing-library/react';
import AddEntitiesView from '../AddEntitiesView';

const mockFunction = jest.fn();

const formatEntity = () => {
  return [];
};
describe('RolesView - Entities', () => {
  it('Should render successfully', () => {
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
