import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { ToolsetAuthType } from '@/src/models/dial/resource';
import ResourceAuthentication from '../ResourceAuthentication';

let isReadOnlyAdmin = false;
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdmin,
}));

describe('ResourceAuthentication', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    isReadOnlyAdmin = false;
  });

  test('renders all three selectable auth type options by default', () => {
    render(<ResourceAuthentication name="toolset-1" />);

    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.NoneAuth)).toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.DialNativeAuth)).not.toBeInTheDocument();
  });

  test('excludeAuthTypes hides the given option', () => {
    render(<ResourceAuthentication name="service-1" excludeAuthTypes={[ToolsetAuthType.NONE]} />);

    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.NoneAuth)).not.toBeInTheDocument();
  });

  test('keeps the currently selected excluded type visible so existing data stays viewable', () => {
    render(
      <ResourceAuthentication
        name="service-1"
        authSettings={{ authentication_type: ToolsetAuthType.NONE }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
      />,
    );

    expect(screen.getByText(ToolsetI18nKey.NoneAuth)).toBeInTheDocument();
  });

  test('renders the DIAL native card for a service already declared with that type', () => {
    render(
      <ResourceAuthentication
        name="dial"
        authSettings={{ authentication_type: ToolsetAuthType.DIAL_NATIVE }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(ToolsetI18nKey.DialNativeAuth)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.DialNativeAuthDescription)).toBeInTheDocument();
  });

  test('clicking the DIAL native card does not change the auth type', async () => {
    const onChange = vi.fn();
    render(
      <ResourceAuthentication
        name="dial"
        authSettings={{ authentication_type: ToolsetAuthType.DIAL_NATIVE }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByText(ToolsetI18nKey.DialNativeAuth));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('the DIAL native card exposes no API key or OAuth fields', () => {
    render(
      <ResourceAuthentication
        name="dial"
        authSettings={{ authentication_type: ToolsetAuthType.DIAL_NATIVE }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(ToolsetI18nKey.WithLoginAndConfig)).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('a read-only admin sees the DIAL native card without crashing', () => {
    isReadOnlyAdmin = true;
    render(
      <ResourceAuthentication
        name="dial"
        authSettings={{ authentication_type: ToolsetAuthType.DIAL_NATIVE }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(ToolsetI18nKey.DialNativeAuth)).toBeInTheDocument();
  });

  test('a read-only admin sees a type this frontend does not know without crashing', () => {
    isReadOnlyAdmin = true;
    render(
      <ResourceAuthentication
        name="dial"
        authSettings={{ authentication_type: 'SOME_FUTURE_TYPE' as ToolsetAuthType }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('SOME_FUTURE_TYPE')).toBeInTheDocument();
  });

  test('DIAL native is not offered when it is not the current selection', () => {
    render(
      <ResourceAuthentication
        name="dial"
        authSettings={{ authentication_type: ToolsetAuthType.OAUTH }}
        excludeAuthTypes={[ToolsetAuthType.NONE]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(ToolsetI18nKey.DialNativeAuth)).not.toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
  });
});
