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
  entityType?: CatalogEntityType;
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

    expect(screen.getByText(apiWritten.$id)).toBeTruthy();
    expect(screen.getByText(fileDeclared.$id)).toBeTruthy();
  });

  /**
   * Display names are not unique, and under the entity-kind filter they tend to repeat the kind —
   * three interceptor schemas all reading "Interceptor". The `$id` is what distinguishes them.
   */
  test('identifies an option by its id rather than its display name', async () => {
    const user = userEvent.setup();
    const namesake: CatalogSchemaOption = { ...fileDeclared, 'dial:catalogDisplayName': 'Model card' };
    renderField({ options: [apiWritten, namesake] });

    await user.click(screen.getByRole('button', { name: 'EntityPlaceholders.SelectCatalogSchema' }));

    expect(screen.queryAllByText('Model card')).toHaveLength(0);
    expect(screen.getByText(apiWritten.$id)).toBeTruthy();
    expect(screen.getByText(namesake.$id)).toBeTruthy();
  });

  test('shows the id once for a schema that has no display name', async () => {
    const user = userEvent.setup();
    const unnamed: CatalogSchemaOption = { ...fileDeclared, 'dial:catalogDisplayName': '' };
    renderField({ options: [unnamed] });

    await user.click(screen.getByRole('button', { name: 'EntityPlaceholders.SelectCatalogSchema' }));

    expect(screen.getAllByText(unnamed.$id)).toHaveLength(1);
  });

  test('stores the picked schema id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ onChange });

    await user.click(screen.getByRole('button', { name: 'EntityPlaceholders.SelectCatalogSchema' }));
    await user.click(screen.getByText(fileDeclared.$id));

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

  test('reports nothing when the selected schema is picked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ schemaId: apiWritten.$id, onChange });

    await user.click(screen.getByRole('button', { name: apiWritten.$id }));
    await user.click(screen.getAllByText(apiWritten.$id).at(-1)!);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('reports nothing when the modal applies the schema already selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ schemaId: fileDeclared.$id, onChange });

    await user.click(screen.getByRole('button', { name: 'Buttons.Browse' }));
    await user.click(screen.getByRole('button', { name: 'apply-from-modal' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('clears the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderField({ schemaId: apiWritten.$id, onChange });

    await user.click(screen.getByRole('button', { name: apiWritten.$id }));
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

describe('CatalogSchemaField — filtered to an entity kind', () => {
  const kindless: CatalogSchemaOption = {
    $id: 'https://host/kindless-card',
    'dial:catalogEntityType': null,
    'dial:catalogDisplayName': 'Kindless card',
  };

  const renderField = (props?: Partial<ComponentProps<typeof CatalogSchemaField>>) =>
    render(
      <CatalogSchemaField
        options={[apiWritten, fileDeclared, kindless]}
        entityType={CatalogEntityType.Model}
        onChange={vi.fn()}
        {...props}
      />,
    );

  beforeEach(() => {
    capturedModalProps = undefined;
    isReadOnlyAdmin.mockReturnValue(false);
    vi.clearAllMocks();
  });

  test('offers only the schemas written for that kind, plus those declaring none', async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole('button', { name: 'EntityPlaceholders.SelectCatalogSchema' }));

    expect(screen.getByText(apiWritten.$id)).toBeTruthy();
    expect(screen.getByText(kindless.$id)).toBeTruthy();
    expect(screen.queryByText(fileDeclared.$id)).toBeNull();
  });

  test('keeps offering the selected schema when its kind does not match', async () => {
    const user = userEvent.setup();
    renderField({ schemaId: fileDeclared.$id });

    await user.click(screen.getByRole('button', { name: fileDeclared.$id }));

    expect(screen.getAllByText(fileDeclared.$id).length).toBeGreaterThan(0);
  });

  test('hands the browse modal the deployment kind and the unfiltered options', async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole('button', { name: 'Buttons.Browse' }));

    expect(capturedModalProps?.entityType).toEqual(CatalogEntityType.Model);
    expect(capturedModalProps?.options).toEqual([apiWritten, fileDeclared, kindless]);
  });
});
