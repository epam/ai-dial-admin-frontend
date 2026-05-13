import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Variable from '@/src/components/Deployments/Fields/ContainerVariables/Variable';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { EntityPlaceholdersI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';

vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, vi.fn(), vi.fn()],
  useDrop: () => [vi.fn(), vi.fn()],
}));

describe('EnvVariable', () => {
  const mockVariable: EnvironmentVariable = {
    name: 'TEST_VAR',
    description: 'Test variable description',
    value: { $type: VALUE_TYPE.SIMPLE, value: 'test-value' },
    mountType: MOUNT_TYPE.CONTENT,
  };

  const baseProps = {
    index: 0,
    variable: mockVariable,
    updateVariable: vi.fn(),
    removeVariable: vi.fn(),
  };

  test('renders variable inputs identified by placeholder', () => {
    render(<Variable {...baseProps} updateVariable={vi.fn()} removeVariable={vi.fn()} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Name)).toHaveValue('TEST_VAR');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description)).toHaveValue('Test variable description');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Value)).toHaveValue('test-value');
  });

  test('inputs carry an aria-label naming the column for screen readers', () => {
    render(<Variable {...baseProps} updateVariable={vi.fn()} removeVariable={vi.fn()} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Name)).toHaveAttribute(
      'aria-label',
      EnvVariablesI18nKey.Name,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description)).toHaveAttribute(
      'aria-label',
      EnvVariablesI18nKey.Description,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Value)).toHaveAttribute('aria-label', 'Basic.Value');
  });

  test('does not render the per-cell label at desktop (labels live in the list header)', () => {
    render(<Variable {...baseProps} updateVariable={vi.fn()} removeVariable={vi.fn()} />);

    // No <label> element should be rendered inside the row in desktop mode (useIsTabletScreen
    // defaults to false in jsdom because window.innerWidth defaults to 1024 in @testing-library)
    expect(screen.queryByText('EnvVariables.Name')).not.toBeInTheDocument();
    expect(screen.queryByText('EnvVariables.Description')).not.toBeInTheDocument();
    expect(screen.queryByText('EnvVariables.MountType')).not.toBeInTheDocument();
  });

  test('calls updateVariable when name changes', () => {
    const updateVariable = vi.fn();
    render(<Variable {...baseProps} updateVariable={updateVariable} removeVariable={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Name), { target: { value: 'NEW_VAR' } });

    expect(updateVariable).toHaveBeenCalled();
    const lastCall = updateVariable.mock.calls.at(-1)?.[0] as EnvironmentVariable;
    expect(lastCall.name).toBe('NEW_VAR');
  });

  test('calls updateVariable when description changes', () => {
    const updateVariable = vi.fn();
    render(<Variable {...baseProps} updateVariable={updateVariable} removeVariable={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), {
      target: { value: 'New description' },
    });

    expect(updateVariable).toHaveBeenCalled();
    const lastCall = updateVariable.mock.calls.at(-1)?.[0] as EnvironmentVariable;
    expect(lastCall.description).toBe('New description');
  });

  test('calls removeVariable with the row index when the trash button is clicked', () => {
    const removeVariable = vi.fn();
    render(<Variable {...baseProps} index={3} updateVariable={vi.fn()} removeVariable={removeVariable} />);

    // DialRemoveButton renders a trash icon button; we locate it by querying buttons containing a tabler trash icon
    const trashBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.querySelector('svg.tabler-icon-trash, svg[class*="tabler-icon-trash"]'),
    );
    expect(trashBtn).toBeDefined();
    fireEvent.click(trashBtn!);

    expect(removeVariable).toHaveBeenCalledWith(3);
  });

  test('row exposes desktop cells in the documented column order', () => {
    const { container } = render(<Variable {...baseProps} updateVariable={vi.fn()} removeVariable={vi.fn()} />);

    // Inputs / interactive controls in column order: drag handle (decorative), Name, Description, Value, file btn, Mount type, trash
    const nameInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Name);
    const descInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description);
    const valueInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Value);
    const allButtons = Array.from(container.querySelectorAll('button'));
    const fileBtn = allButtons.find((b) => b.querySelector('svg[class*="tabler-icon-file-arrow-right"]'));
    const trashBtn = allButtons.find((b) => b.querySelector('svg[class*="tabler-icon-trash"]'));
    const dragHandle = container.querySelector('[aria-label="Drag to reorder"]');

    expect(dragHandle).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
    expect(descInput).toBeInTheDocument();
    expect(valueInput).toBeInTheDocument();
    expect(fileBtn).toBeDefined();
    expect(trashBtn).toBeDefined();

    // Verify document order: name < description < value < file button < trash
    const order = [nameInput, descInput, valueInput, fileBtn!, trashBtn!];
    for (let i = 1; i < order.length; i++) {
      const positionRelation = order[i - 1].compareDocumentPosition(order[i]);
      // eslint-disable-next-line no-bitwise
      expect(positionRelation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  test('clicking the file-upload button triggers the hidden file input and uploads a file as VALUE_TYPE.FILE', async () => {
    const updateVariable = vi.fn();
    const { container } = render(<Variable {...baseProps} updateVariable={updateVariable} removeVariable={vi.fn()} />);

    const fileBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.querySelector('svg[class*="tabler-icon-file-arrow-right"]'),
    );
    expect(fileBtn).toBeDefined();
    const hiddenInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(hiddenInput).toBeInTheDocument();

    // Spy on .click() to confirm the button delegates to the hidden input
    const clickSpy = vi.spyOn(hiddenInput, 'click');
    fireEvent.click(fileBtn!);
    expect(clickSpy).toHaveBeenCalled();

    // Simulate selecting a file
    const file = new File(['hello-content'], 'config.yaml', { type: 'text/yaml' });
    Object.defineProperty(hiddenInput, 'files', { value: [file], configurable: true });

    // Mock FileReader to synchronously call onload with a data: URL
    const originalFileReader = globalThis.FileReader;
    class StubFileReader {
      public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      public result: string | ArrayBuffer | null = null;
      readAsDataURL(_blob: Blob) {
        this.result = 'data:text/yaml;base64,aGVsbG8tY29udGVudA==';
        this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
      }
    }
    (globalThis as unknown as { FileReader: typeof FileReader }).FileReader =
      StubFileReader as unknown as typeof FileReader;

    fireEvent.change(hiddenInput);

    await waitFor(() => {
      expect(updateVariable).toHaveBeenCalled();
    });
    const lastCall = updateVariable.mock.calls.at(-1)?.[0] as EnvironmentVariable;
    expect(lastCall.value).toMatchObject({
      $type: VALUE_TYPE.FILE,
      fileName: 'config.yaml',
      fileContent: 'aGVsbG8tY29udGVudA==',
    });

    (globalThis as unknown as { FileReader: typeof FileReader }).FileReader = originalFileReader;
  });
});
