import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AddEntitiesView from '../AddEntitiesView';

describe('AddEntitiesView', () => {
  it('renders the view title and entity count', () => {
    render(<AddEntitiesView viewTitle="Entities" models={[]} applications={[]} roles={[]} keys={[]} />);
    expect(screen.getByText(/Entities: 0/)).toBeInTheDocument();
  });

  it('shows no data content when no entities', () => {
    render(<AddEntitiesView models={[]} applications={[]} roles={[]} keys={[]} emptyDataTitle="No Data" />);
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });

  it('renders add button if onAdd is provided', () => {
    const onAdd = () => {};
    render(<AddEntitiesView models={[]} applications={[]} roles={[]} keys={[]} onAdd={onAdd} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
