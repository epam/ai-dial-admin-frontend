import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogEntityType, CatalogSchemaOption } from '@/src/models/dial/catalog-schema';
import CatalogSchemaField from '../CatalogSchemaField';

const isReadOnlyAdmin = vi.fn(() => false);

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdmin(),
}));

interface ModalProps {
  selectedId?: string;
  options?: CatalogSchemaOption[];
  onApply: (id?: string) => void;
}

let capturedModalProps: ModalProps | undefined;

vi.mock('../SelectCatalogSchemaModal', () => ({
  default: (props: ModalProps) => {
    capturedModalProps = props;
    return (
      <button type="button" onClick={() => props.onApply('https://host/agent-card')}>
        apply-from-modal
      </button>
    );
  },
}));

const apiWritten: CatalogSchemaOption = {
  $id: 'https://host/model-card',
  'dial:catalogEntityType': CatalogEntityType.Model,
  'dial:catalogDisplayName': 'Model card',
};

const fileDeclared: CatalogSchemaOption = {
  $id: 'https://host/agent-card',
  'dial:catalogEntityType': CatalogEntityType.Agent,
  'dial:catalogDisplayName': 'Agent card',
};

describe('CatalogSchemaField', () => {
  const renderField = (props?: Partial<ComponentProps<typeof CatalogSchemaField>>) =>
    render(<CatalogSchemaField options={[apiWritten, fileDeclared]} onChange={vi.fn()} {...props} />);

  beforeEach(() => {
    capturedModalProps = undefined;
    isReadOnlyAdmin.mockReturnValue(false);
    vi.clearAllMocks();
  });

  test('labels the field as the catalog schema selection', () => {
    renderField();

    expect(screen.getByText(EntitiesI18nKey.CatalogSchema)).toBeTruthy();
  });

  test('lists both schema populations as options', async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole('button', { name: 'EntityPlaceholders.SelectCatalogSchema' }));

    expect(screen.getByText('Model card')).toBeTruthy();
    expect(screen.getByText('Agent card')).toBeTruthy();
  });

  test('stores the picked schema id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ onChange });

    await user.click(screen.getByRole('button', { name: 'EntityPlaceholders.SelectCatalogSchema' }));
    await user.click(screen.getByText('Agent card'));

    expect(onChange).toHaveBeenCalledWith(fileDeclared.$id);
  });

  test('hands the modal the selection to apply', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ schemaId: apiWritten.$id, onChange });

    await user.click(screen.getByRole('button', { name: 'Buttons.Browse' }));
    await user.click(screen.getByRole('button', { name: 'apply-from-modal' }));

    expect(capturedModalProps?.selectedId).toEqual(apiWritten.$id);
    expect(onChange).toHaveBeenCalledWith(fileDeclared.$id);
  });

  test('clears the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ schemaId: apiWritten.$id, onChange });

    await user.click(screen.getByRole('button', { name: 'Model card' }));
    await user.click(screen.getByText(BasicI18nKey.None));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('reports a failed option read on the field', () => {
    renderField({ options: [], optionsError: EntitiesI18nKey.OptionListUnavailable });

    expect(screen.getByText(EntitiesI18nKey.OptionListUnavailable)).toBeTruthy();
  });

  test('offers no open-in-new-tab button with no schema selected', () => {
    renderField();

    expect(screen.queryByRole('button', { name: 'Buttons.Open' })).toBeNull();
  });

  test('a read-only admin cannot change the selection', () => {
    isReadOnlyAdmin.mockReturnValue(true);
    renderField({ schemaId: apiWritten.$id });

    expect(screen.getByRole('button', { name: 'Buttons.Browse' }).getAttribute('disabled')).not.toBeNull();
  });
});
