import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import TestCasesSchemaModal from '@/src/components/TestSuites/TestCases/TestCasesSchemaModal';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

vi.mock('@/src/components/TestSuites/TestCaseSchema/SchemaManager', () => ({
  default: () => <div>schema manager</div>,
}));

const field = (name: string): TestCaseSchema => ({
  name,
  type: TestCaseItemType.STRING,
  required: false,
  description: '',
});

describe('TestCasesSchemaModal', () => {
  const renderModal = (initialSchema: TestCaseSchema[]) =>
    render(<TestCasesSchemaModal isModalOpen initialSchema={initialSchema} onClose={vi.fn()} onApply={vi.fn()} />);

  test('enables Apply when names are unique', () => {
    renderModal([field('prompt'), field('answer')]);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).toBeEnabled();
  });

  test('disables Apply when names differ only in case', () => {
    renderModal([field('prompt'), field('Prompt')]);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).toBeDisabled();
  });
});
