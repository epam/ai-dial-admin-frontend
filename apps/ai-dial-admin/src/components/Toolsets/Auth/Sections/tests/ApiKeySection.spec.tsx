import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import ApiKeySection from '../ApiKeySection';

describe('ApiKeySection', () => {
  test('renders input with correct value and placeholder', () => {
    render(<ApiKeySection authSettings={{ apiKeyHeader: 'test-key' }} disabled={false} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Header);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test-key');
    expect(input).not.toBeDisabled();
  });

  test('renders disabled input', () => {
    render(<ApiKeySection authSettings={{ apiKeyHeader: 'disabled-key' }} disabled={true} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Header);
    expect(input).toBeDisabled();
    expect(input).toHaveValue('disabled-key');
  });

  test('calls onChange with updated apiKeyHeader', () => {
    const handleChange = vi.fn();
    render(<ApiKeySection authSettings={{ apiKeyHeader: 'old-key' }} onChange={handleChange} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Header);
    fireEvent.change(input, { target: { value: 'new-key' } });
    expect(handleChange).toHaveBeenCalledWith({ apiKeyHeader: 'new-key' });
  });

  test('handles missing authSettings', () => {
    const handleChange = vi.fn();
    render(<ApiKeySection onChange={handleChange} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Header);
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: 'added-key' } });
    expect(handleChange).toHaveBeenCalledWith({ apiKeyHeader: 'added-key' });
  });
});
