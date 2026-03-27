import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, ButtonsI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import EditSchemaField from '../EditSchemaField';

describe('EditSchemaField', () => {
  const defaultField: TestCaseSchema = {
    name: 'temperature',
    type: TestCaseItemType.NUMBER,
    required: true,
    description: 'Sampling temperature',
  };

  const defaultProps = {
    field: defaultField,
    isNew: false,
    existingNames: ['other_field'],
    onSave: vi.fn(),
    onClose: vi.fn(),
  };

  test('renders form fields with current values', () => {
    render(<EditSchemaField {...defaultProps} />);

    expect(screen.getByText(TestSuitesI18nKey.EditField)).toBeInTheDocument();
    expect(screen.getByDisplayValue('temperature')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sampling temperature')).toBeInTheDocument();
  });

  test('renders Add field title when isNew is true', () => {
    render(<EditSchemaField {...defaultProps} isNew={true} field={{ name: '', type: TestCaseItemType.STRING, required: false, description: '' }} />);

    expect(screen.getByText(TestSuitesI18nKey.AddField)).toBeInTheDocument();
  });

  test('disables name input for existing fields', () => {
    render(<EditSchemaField {...defaultProps} isNew={false} />);

    const nameInput = screen.getByDisplayValue('temperature');
    expect(nameInput).toBeDisabled();
  });

  test('enables name input for new fields', () => {
    render(<EditSchemaField {...defaultProps} isNew={true} />);

    const nameInput = screen.getByDisplayValue('temperature');
    expect(nameInput).not.toBeDisabled();
  });

  test('Save button is disabled when name is empty', () => {
    render(
      <EditSchemaField
        {...defaultProps}
        isNew={true}
        field={{ name: '', type: TestCaseItemType.STRING, required: false, description: '' }}
      />,
    );

    const saveButton = screen.getByText(ButtonsI18nKey.Save).closest('button');
    expect(saveButton).toBeDisabled();
  });

  test('Save button is disabled when name is duplicate', () => {
    render(
      <EditSchemaField
        {...defaultProps}
        isNew={true}
        field={{ name: 'other_field', type: TestCaseItemType.STRING, required: false, description: '' }}
        existingNames={['other_field']}
      />,
    );

    const saveButton = screen.getByText(ButtonsI18nKey.Save).closest('button');
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(TestSuitesI18nKey.DuplicateFieldName)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<EditSchemaField {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('calls onSave and onClose when Save is clicked', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditSchemaField {...defaultProps} onSave={onSave} onClose={onClose} />);

    fireEvent.click(screen.getByText(ButtonsI18nKey.Save));
    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
