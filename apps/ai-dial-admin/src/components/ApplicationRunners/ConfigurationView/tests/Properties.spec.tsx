import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import SchemeProperties from '../Properties';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

describe('SchemeProperties', () => {
  const baseRunner = {
    $id: 'runner-1',
    'dial:applicationTypeDisplayName': 'Runner Name',
    description: 'desc',
  };

  test('renders all fields and handles changes', () => {
    const onChangeRunner = vi.fn();
    render(<SchemeProperties runner={baseRunner} onChangeRunner={onChangeRunner} />);
    // ID field
    expect(screen.getAllByAltText(EntityFieldsI18nKey.id)[0]).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'new-id' } });
    expect(onChangeRunner).toHaveBeenCalledWith(expect.objectContaining({ $id: 'new-id' }));

    // Name field
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'new name' },
    });
    expect(onChangeRunner).toHaveBeenCalledWith(
      expect.objectContaining({ 'dial:applicationTypeDisplayName': 'new name' }),
    );

    // Description field
    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), {
      target: { value: 'new desc' },
    });
    expect(onChangeRunner).toHaveBeenCalledWith(expect.objectContaining({ description: 'new desc' }));
  });

  test('does not render id field if isImmutable', () => {
    render(<SchemeProperties runner={baseRunner} isImmutable onChangeRunner={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.id)).toBeNull();
  });

  test('renders AppRunnerExtendedProperties if isImmutable', () => {
    render(<SchemeProperties runner={baseRunner} isImmutable onChangeRunner={vi.fn()} />);
    // extended field
    expect(screen.getByText(EntityFieldsI18nKey.topics)).toBeInTheDocument();
  });
});
