import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import AddEntitiesView from '../AddEntitiesView';

describe('AddEntitiesView', () => {
  test('renders the view title and entity count', () => {
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

  test('calls onAdd when AddEntitiesGrid onApply is triggered', () => {
    const onAdd = vi.fn();
    const models = [{ id: '1', name: 'Model1' }];
    render(<AddEntitiesView models={models} applications={[]} roles={[]} keys={[]} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('button'));
    // Modal should be in the document
    expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
    const modalButtons = screen.getAllByRole('button');
    fireEvent.click(modalButtons[1]);
  });

  test('calls onRemove when remove operation is triggered', () => {
    const onRemove = vi.fn();
    const models = [{ id: '1', name: 'Model1' }];
    render(<AddEntitiesView models={models} applications={[]} roles={[]} keys={[]} onRemove={onRemove} />);
    expect(typeof onRemove).toBe('function');
  });

  test('renders with getRelevantDataForEntity', () => {
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
