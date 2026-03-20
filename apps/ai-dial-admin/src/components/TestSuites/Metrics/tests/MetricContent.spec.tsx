import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import MetricContent from '../MetricContent';
import { TestSuite } from '@/src/models/evaluation/test-suite';

vi.mock('../Bindings', () => ({
  default: () => <div role="region" aria-label="bindings" />,
}));

vi.mock('../Results', () => ({
  default: () => <div role="region" aria-label="results" />,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialInput: ({ value, onChange }: any) => (
    <input role="textbox" aria-label="metric-name" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  ),
  DialNeutralButton: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  DialPrimaryButton: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
  BASE_BUTTON_ICON_PROPS: {},
  STANDARD_CONTROL_WIDTH: '',
}));

describe('MetricContent', () => {
  const mockMetric: Metric = {
    id: 'metric-1',
    name: 'Test Metric',
    configBindings: [],
    inputBindings: [],
    metricDeclarationVersion: { description: 'Declaration description' },
  };

  const mockTestSuite: TestSuite = {
    id: 'suite-1',
    name: 'Test Suite',
  };

  const onDelete = vi.fn();
  const onUpdate = vi.fn();

  test('renders metric name input and content region', () => {
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    expect(screen.getByRole('textbox', { name: 'metric-name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'metric-name' })).toHaveValue('Test Metric');
  });

  test('renders Delete button when unchanged', () => {
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeInTheDocument();
  });

  test('calls onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('renders Bindings region', () => {
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    expect(screen.getByRole('region', { name: 'bindings' })).toBeInTheDocument();
  });

  test('renders Results region', () => {
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    expect(screen.getByRole('region', { name: 'results' })).toBeInTheDocument();
  });

  test('shows Save and Discard when name is changed', async () => {
    const user = userEvent.setup();
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    const nameInput = screen.getByRole('textbox', { name: 'metric-name' });
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeInTheDocument();
  });

  test('calls onUpdate when Save is clicked after change', async () => {
    const user = userEvent.setup();
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    const nameInput = screen.getByRole('textbox', { name: 'metric-name' });
    await user.clear(nameInput);
    await user.type(nameInput, 'New Name');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
  });

  test('resets name when Discard is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MetricContent selectedTestSuite={mockTestSuite} metric={mockMetric} onDelete={onDelete} onUpdate={onUpdate} />,
    );

    const nameInput = screen.getByRole('textbox', { name: 'metric-name' });
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');
    expect(nameInput).toHaveValue('Changed Name');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(nameInput).toHaveValue('Test Metric');
  });
});
