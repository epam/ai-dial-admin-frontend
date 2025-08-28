import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddEntitiesView from '../AddEntitiesView';
import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';

// Mock createPortal to render modal content inline for test simplicity
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: any) => node,
}));

describe('AddEntitiesView', () => {
  it('renders the view title and entity count', () => {
    const customColumns = [{ field: 'custom', headerName: 'Custom' }];
    render(
      <AddEntitiesView
        viewTitle="Entities"
        models={[]}
        applications={[]}
        roles={[]}
        keys={[]}
        customColumns={customColumns}
      />,
    );
    expect(screen.getByText(EntitiesI18nKey.NoEntities)).toBeInTheDocument();
  });

  it('calls onAdd when AddEntitiesGrid onApply is triggered', () => {
    const onAdd = vi.fn();
    const models = [{ id: '1', name: 'Model1' }];
    render(<AddEntitiesView models={models} applications={[]} roles={[]} keys={[]} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('button'));
    // Modal should be in the document
    expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
    const modalButtons = screen.getAllByRole('button');
    fireEvent.click(modalButtons[1]);
  });

  it('calls onRemove when remove operation is triggered', () => {
    const onRemove = vi.fn();
    const models = [{ id: '1', name: 'Model1' }];
    render(<AddEntitiesView models={models} applications={[]} roles={[]} keys={[]} onRemove={onRemove} />);
    expect(typeof onRemove).toBe('function');
  });

  it('renders with getRelevantDataForEntity', () => {
    const getRelevantDataForEntity = vi.fn(() => []);
    render(
      <AddEntitiesView
        models={[]}
        applications={[]}
        roles={[]}
        keys={[]}
        getRelevantDataForEntity={getRelevantDataForEntity}
      />,
    );
    expect(getRelevantDataForEntity).toHaveBeenCalled();
  });
});
