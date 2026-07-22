import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AppRunners from '@/src/components/SourceField/Application/AppRunners';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn(),
}));

vi.mock('@/src/utils/schema', () => ({
  getSchemaDefaults: vi.fn(() => ({ propA: 'default-a' })),
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSelectField: ({ id, options, onChange, value, disabled }: any) => (
      <select
        aria-label={id}
        data-testid={`select-${id}`}
        value={value ?? ''}
        disabled={!!disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">--</option>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
    DialInputPopup: ({ children, selectedValue }: any) => (
      <div data-testid="dial-input-popup">
        <span>{selectedValue}</span>
        {children}
      </div>
    ),
    DialLabel: ({ label }: any) => <label>{label}</label>,
    DialNeutralButton: ({ label, onClick }: any) => (
      <button type="button" onClick={onClick}>
        {label}
      </button>
    ),
  };
});

vi.mock('@/src/hooks/use-is-mobile-screen', () => ({
  useIsMobileScreen: () => false,
}));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => false,
}));

// Expose onApply as a button so tests can trigger runner selection in the immutable branch.
vi.mock('@/src/components/SourceField/Application/SelectAppRunnersModal', () => ({
  __esModule: true,
  default: ({ onApply }: any) => (
    <button type="button" data-testid="immutable-apply-runner" onClick={() => onApply('urn:runner:1')}>
      apply
    </button>
  ),
}));

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';

const runner: DialApplicationScheme = {
  $id: 'urn:runner:1',
  $schema: 'dial:schema',
  'dial:applicationTypeDisplayName': 'Runner One',
} as unknown as DialApplicationScheme;

const makeEntity = (overrides: Partial<DialApplication> = {}): DialApplication =>
  ({
    name: 'app-1',
    displayName: 'App',
    ...overrides,
  }) as unknown as DialApplication;

describe('AppRunners (entity-mode side-effects)', () => {
  test('successful resolve writes source + applicationProperties from resolved schema', async () => {
    (getResolvedApplicationScheme as any).mockResolvedValue({
      success: true,
      response: { schema: runner },
    });

    const onChange = vi.fn();
    render(<AppRunners entity={makeEntity()} onChange={onChange} runners={[runner]} />);

    fireEvent.change(screen.getByTestId('select-sourceEntity'), { target: { value: 'urn:runner:1' } });

    await waitFor(() => {
      const last = onChange.mock.calls.at(-1)?.[0] as DialApplication | undefined;
      expect(last?.applicationProperties).toEqual({ propA: 'default-a' });
    });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.source?.$type).toBe(SOURCE_TYPE.SCHEMA);
    expect(last.source?.applicationTypeSchemaId).toBe('urn:runner:1');
    expect(last.endpoint).toBeUndefined();
    expect(last.mcp).toBeUndefined();
    expect(last.applicationProperties).toEqual({ propA: 'default-a' });
  });

  test('failed resolve falls back to unresolved runner for defaults derivation', async () => {
    (getResolvedApplicationScheme as any).mockResolvedValue({ success: false, response: null });

    const onChange = vi.fn();
    render(<AppRunners entity={makeEntity()} onChange={onChange} runners={[runner]} />);

    fireEvent.change(screen.getByTestId('select-sourceEntity'), { target: { value: 'urn:runner:1' } });

    await waitFor(() => {
      const last = onChange.mock.calls.at(-1)?.[0] as DialApplication | undefined;
      expect(last?.applicationProperties).toEqual({ propA: 'default-a' });
    });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.source?.$type).toBe(SOURCE_TYPE.SCHEMA);
    expect(last.source?.applicationTypeSchemaId).toBe('urn:runner:1');
  });

  test('isEntityImmutable preserves existing applicationProperties on runner selection', async () => {
    (getResolvedApplicationScheme as any).mockResolvedValue({
      success: true,
      response: { schema: runner },
    });

    const onChange = vi.fn();
    const existingProps = { keep: 'me' } as unknown as DialApplication['applicationProperties'];

    render(
      <AppRunners
        entity={makeEntity({ applicationProperties: existingProps })}
        onChange={onChange}
        runners={[runner]}
        isEntityImmutable
      />,
    );

    fireEvent.click(screen.getByTestId('immutable-apply-runner'));

    await waitFor(() => {
      const last = onChange.mock.calls.at(-1)?.[0] as DialApplication | undefined;
      expect(last?.source?.applicationTypeSchemaId).toBe('urn:runner:1');
    });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.applicationProperties).toEqual(existingProps);
    // Crucially, NOT the getSchemaDefaults result:
    expect(last.applicationProperties).not.toEqual({ propA: 'default-a' });
  });
});

describe('AppRunners (legacy selectedValue/onChangeValue API)', () => {
  test('calls onChangeValue when entity/onChange are not provided', async () => {
    (getResolvedApplicationScheme as any).mockResolvedValue({
      success: true,
      response: { schema: runner },
    });

    const onChangeValue = vi.fn();
    render(<AppRunners selectedValue={''} onChangeValue={onChangeValue} runners={[runner]} />);

    fireEvent.change(screen.getByTestId('select-sourceEntity'), { target: { value: 'urn:runner:1' } });

    await waitFor(() => {
      expect(onChangeValue).toHaveBeenCalledWith('urn:runner:1', { propA: 'default-a' });
    });
  });
});
