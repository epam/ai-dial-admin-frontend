import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ApplicationRoute } from '@/src/types/routes';
import EntityFeatures from '../Features';
import { FeaturesI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => false,
}));

vi.mock('@/src/components/BaseControls/Endpoint/Endpoint', () => ({ default: () => null }));
vi.mock('@/src/components/EntityTabs/Features/ReasoningEffortsInput', () => ({ default: () => null }));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Label: ({ label }: any) => <span>{label}</span>,
  TooltipPlacement: { Bottom: 'bottom' },
  Tooltip: ({ tooltip, triggerClassName, children }: any) => (
    <div role="group" aria-label={tooltip || NO_TOOLTIP}>
      {children}
    </div>
  ),
  Switch: ({ labelProps, isOn, onChange, disabled, id }: any) => (
    <input
      type="checkbox"
      role="switch"
      aria-label={labelProps?.label}
      id={id}
      checked={!!isOn}
      disabled={disabled}
      onChange={() => onChange(!isOn)}
    />
  ),
}));

const NO_TOOLTIP = 'no-tooltip';
const appRunner = {} as DialApplicationScheme;

describe('EntityFeatures', () => {
  test('renders a switch for a models feature', () => {
    render(<EntityFeatures view={ApplicationRoute.Models} entity={{ features: {} }} onChangeEntity={vi.fn()} />);

    expect(screen.getByRole('switch', { name: FeaturesI18nKey.systemPromptSupported })).toBeInTheDocument();
  });

  test('renders nothing for an unknown view', () => {
    render(<EntityFeatures view={ApplicationRoute.Keys} entity={{ features: {} }} onChangeEntity={vi.fn()} />);

    expect(screen.queryByRole('switch')).toBeNull();
  });

  test('lays the switch group out without stretching its switches', () => {
    render(<EntityFeatures view={ApplicationRoute.Models} entity={{ features: {} }} onChangeEntity={vi.fn()} />);

    const triggers = screen.getAllByRole('group');
    expect(triggers.length).toBeGreaterThan(0);
    triggers.forEach((trigger) => expect(trigger.parentElement).toHaveClass('items-start'));
  });

  test('has no tooltip text on editable switches', () => {
    render(<EntityFeatures view={ApplicationRoute.Models} entity={{ features: {} }} onChangeEntity={vi.fn()} />);

    screen.getAllByRole('group').forEach((trigger) => expect(trigger).toHaveAccessibleName(NO_TOOLTIP));
  });

  test('shows the inherited tooltip and disables switches that an app runner supplies', () => {
    render(
      <EntityFeatures
        view={ApplicationRoute.Applications}
        entity={{ features: {} }}
        appRunner={appRunner}
        onChangeEntity={vi.fn()}
      />,
    );

    const inherited = screen.getAllByRole('group', { name: FeaturesI18nKey.AppRunnerInherited });
    inherited.forEach((trigger) => {
      expect(within(trigger).getByRole('switch')).toBeDisabled();
    });
  });
});
