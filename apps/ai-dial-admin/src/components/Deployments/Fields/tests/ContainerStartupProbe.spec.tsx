import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { DEFAULT_PROBE_CONFIG } from '@/src/constants/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import {
  CONTAINER_SOURCE_TYPE,
  CONTAINER_STATUS,
  CONTAINER_TYPE,
  PROBE_TYPE,
} from '@/src/types/deployments/containers';
import ContainerStartupProbe from '../ContainerStartupProbe';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialSwitch: ({ label, isOn, onChange, caption }: any) => (
    <label>
      <span>{label}</span>
      {caption && <span>{caption}</span>}
      <input type="checkbox" role="switch" aria-label={label} checked={!!isOn} onChange={() => onChange(!isOn)} />
    </label>
  ),
}));

vi.mock('@/src/components/Common/Accordion/Accordion', () => ({
  default: ({ title, children }: any) => (
    <div aria-label={title}>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/src/components/Deployments/Fields/ContainerStartupProbe/Endpoint', () => ({
  default: () => <div aria-label="endpoint" />,
}));

vi.mock('@/src/components/Deployments/Fields/ContainerStartupProbe/AdvancedTiming', () => ({
  default: () => <div aria-label="advanced-timing" />,
}));

const makeContainer = (probeOverrides?: Partial<Container['probeProperties']>): Container => ({
  name: 'test-container',
  $type: CONTAINER_TYPE.MCP,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' },
  status: CONTAINER_STATUS.RUNNING,
  metadata: {},
  probeProperties: probeOverrides ? { enabled: false, ...probeOverrides } : undefined,
});

describe('ContainerStartupProbe', () => {
  test('renders switch in off state when no probeProperties', () => {
    const container = makeContainer();

    render(<ContainerStartupProbe container={container} setContainer={vi.fn()} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).not.toBeChecked();
  });

  test('renders switch in on state when probe is enabled', () => {
    const container = makeContainer({ enabled: true });

    render(<ContainerStartupProbe container={container} setContainer={vi.fn()} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
  });

  test('shows endpoint and timing fields when probe is enabled', () => {
    const container = makeContainer({ enabled: true });

    render(<ContainerStartupProbe container={container} setContainer={vi.fn()} />);

    expect(screen.getByLabelText('endpoint')).toBeInTheDocument();
    expect(screen.getByLabelText('advanced-timing')).toBeInTheDocument();
  });

  test('hides endpoint and timing fields when probe is disabled', () => {
    const container = makeContainer({ enabled: false });

    render(<ContainerStartupProbe container={container} setContainer={vi.fn()} />);

    expect(screen.queryByLabelText('endpoint')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('advanced-timing')).not.toBeInTheDocument();
  });

  test('enables probe with defaults when toggling on without existing config', async () => {
    const user = userEvent.setup();
    const setContainer = vi.fn();
    const container = makeContainer();

    render(<ContainerStartupProbe container={container} setContainer={setContainer} />);

    await user.click(screen.getByRole('switch'));

    expect(setContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        probeProperties: { ...DEFAULT_PROBE_CONFIG, enabled: true },
      }),
    );
  });

  test('preserves custom values when toggling off', async () => {
    const user = userEvent.setup();
    const setContainer = vi.fn();
    const customProbe = {
      enabled: true,
      initialDelaySeconds: 30,
      periodSeconds: 5,
      failureThreshold: 10,
      timeoutSeconds: 2,
      probe: { $type: PROBE_TYPE.HTTP_GET, port: 8080, path: '/health' },
    };
    const container = makeContainer(customProbe);

    render(<ContainerStartupProbe container={container} setContainer={setContainer} />);

    await user.click(screen.getByRole('switch'));

    expect(setContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        probeProperties: { ...customProbe, enabled: false },
      }),
    );
  });

  test('preserves custom values when toggling back on', async () => {
    const user = userEvent.setup();
    const setContainer = vi.fn();
    const customProbe = {
      enabled: false,
      initialDelaySeconds: 30,
      periodSeconds: 5,
      failureThreshold: 10,
      timeoutSeconds: 2,
      probe: { $type: PROBE_TYPE.HTTP_GET, port: 8080, path: '/health' },
    };
    const container = makeContainer(customProbe);

    render(<ContainerStartupProbe container={container} setContainer={setContainer} />);

    await user.click(screen.getByRole('switch'));

    expect(setContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        probeProperties: { ...customProbe, enabled: true },
      }),
    );
  });
});
