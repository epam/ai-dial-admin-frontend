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
    expect(screen.getByLabelText('ID')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'new-id' } });
    expect(onChangeRunner).toHaveBeenCalledWith(expect.objectContaining({ $id: 'new-id' }));

    // Name field
    expect(screen.getByLabelText('DisplayName')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'new name' },
    });
    expect(onChangeRunner).toHaveBeenCalledWith(
      expect.objectContaining({ 'dial:applicationTypeDisplayName': 'new name' }),
    );

    // Description field
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), {
      target: { value: 'new desc' },
    });
    expect(onChangeRunner).toHaveBeenCalledWith(expect.objectContaining({ description: 'new desc' }));
  });

  test('shows id error and invalid', () => {
    render(<SchemeProperties runner={{ ...baseRunner, $id: 'bad' }} onChangeRunner={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'bad' } });
    expect(screen.getByText('id error')).toBeInTheDocument();
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  test('shows description error and invalid', () => {
    render(<SchemeProperties runner={baseRunner} onChangeRunner={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), { target: { value: 'bad' } });
    expect(screen.getByText('desc error')).toBeInTheDocument();
    expect(screen.getByText('invalid')).toBeInTheDocument();
  });

  test('does not render id field if isImmutable', () => {
    render(<SchemeProperties runner={baseRunner} isImmutable onChangeRunner={vi.fn()} />);
    expect(screen.queryByLabelText(EntityFieldsI18nKey.id)).toBeNull();
  });

  test('renders AppRunnerExtendedProperties if isImmutable', () => {
    render(<SchemeProperties runner={baseRunner} isImmutable onChangeRunner={vi.fn()} />);
    // extended field
    expect(screen.getByText(EntityFieldsI18nKey['dial:applicationTypePlaybackSupport'])).toBeInTheDocument();
  });
});
