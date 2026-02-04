import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import AdapterProperties from '../Properties/Properties';

describe('AdapterProperties', () => {
  const baseEntity = {
    name: 'adapter1',
    displayName: 'Adapter One',
    description: 'desc',
    baseEndpoint: 'http://endpoint',
  };

  test('renders all fields', () => {
    render(<AdapterProperties entity={baseEntity} names={['adapter1', 'adapter2']} onChangeAdapter={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.id)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.baseEndpoint)).toBeInTheDocument();
  });

  test('calls onChangeAdapter when name changes', () => {
    const onChangeAdapter = vi.fn();
    render(
      <AdapterProperties entity={baseEntity} names={['adapter1', 'adapter2']} onChangeAdapter={onChangeAdapter} />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'adapter3' } });
    expect(onChangeAdapter).toHaveBeenCalledWith(expect.objectContaining({ name: 'adapter3' }));
  });

  test('calls onChangeAdapter when displayName changes', () => {
    const onChangeAdapter = vi.fn();
    render(<AdapterProperties entity={baseEntity} names={['adapter1']} onChangeAdapter={onChangeAdapter} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'New Name' },
    });
    expect(onChangeAdapter).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'New Name' }));
  });

  test('calls onChangeAdapter when endpoint changes', () => {
    const onChangeAdapter = vi.fn();
    render(
      <AdapterProperties
        entity={{ ...baseEntity, baseEndpoint: void 0 }}
        names={['adapter1']}
        onChangeAdapter={onChangeAdapter}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Endpoint), {
      target: { value: 'http://new' },
    });
    expect(onChangeAdapter).toHaveBeenCalledWith(expect.objectContaining({ baseEndpoint: 'http://new' }));
  });

  test('does not render name field if isEntityImmutable', () => {
    render(<AdapterProperties entity={baseEntity} names={['adapter1']} onChangeAdapter={vi.fn()} isEntityImmutable />);
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.Id)).toBeNull();
  });
});
