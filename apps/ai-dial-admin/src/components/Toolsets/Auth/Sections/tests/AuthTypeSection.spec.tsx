import { describe, it, expect, vi, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolsetAuthType } from '@/src/models/dial/toolset';
import { EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import AuthTypeSection from '../AuthTypeSection';

const baseConfig = {
  id: ToolsetAuthType.API_KEY,
  icon: <span>icon</span>,
  title: 'API Key',
};
const oauthConfig = {
  id: ToolsetAuthType.OAUTH,
  icon: <span>icon</span>,
  title: 'OAuth',
};
const noneConfig = {
  id: ToolsetAuthType.NONE,
  icon: <span>icon</span>,
  title: 'None',
};

describe('AuthTypeSection', () => {
  test('renders config title and icon', () => {
    render(<AuthTypeSection config={baseConfig} isSelected={false} />);
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByText('icon')).toBeInTheDocument();
  });

  test('calls onClick when header is clicked', () => {
    const onClick = vi.fn();
    render(<AuthTypeSection config={baseConfig} isSelected={false} onClick={onClick} />);
    fireEvent.click(screen.getByText('API Key'));
    expect(onClick).toHaveBeenCalledWith(ToolsetAuthType.API_KEY);
  });

  test('shows ApiKeySection when selected and API_KEY', () => {
    render(<AuthTypeSection config={baseConfig} isSelected={true} />);
    expect(screen.getByText('API Key')).toBeInTheDocument();
  });

  test('shows OAuth radio group when selected and OAUTH', () => {
    render(<AuthTypeSection view={ApplicationRoute.AssetsToolsets} config={oauthConfig} isSelected={true} />);
    expect(screen.getByText('OAuth')).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.WithLogin)).toBeInTheDocument();
  });

  test('shows OAuthSection when With_config_and_login selected', () => {
    render(
      <AuthTypeSection
        view={ApplicationRoute.AssetsToolsets}
        config={oauthConfig}
        isSelected={true}
        authSettings={{ clientId: 'client' }}
      />,
    );
    expect(screen.getByText('OAuth')).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.WithLoginAndConfig)).toBeInTheDocument();
  });

  test('does not show details when config id is NONE', () => {
    render(<AuthTypeSection config={noneConfig} isSelected={true} />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.WithLogin)).not.toBeInTheDocument();
  });

  test('calls onChange from ApiKeySection', () => {
    const onChange = vi.fn();
    render(
      <AuthTypeSection
        config={baseConfig}
        isSelected={true}
        authSettings={{ apiKeyHeader: 'old-key' }}
        onChange={onChange}
      />,
    );
    // Simulate input change by finding input by placeholder
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Header);
    fireEvent.change(input, { target: { value: 'new-key' } });
    expect(onChange).toHaveBeenCalledWith({ apiKeyHeader: 'new-key' });
  });
});
