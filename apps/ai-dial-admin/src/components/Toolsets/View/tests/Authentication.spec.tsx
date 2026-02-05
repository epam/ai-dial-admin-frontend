import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Authentication from '../../Auth/Authentication';
import { ToolsetAuthType, Toolset } from '@/src/models/dial/toolset';
import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';

const baseToolset: Toolset = {
  authSettings: { authenticationType: ToolsetAuthType.API_KEY },
} as Toolset;
const oauthToolset: Toolset = {
  authSettings: { authenticationType: ToolsetAuthType.OAUTH },
} as Toolset;
const noneToolset: Toolset = {
  authSettings: { authenticationType: ToolsetAuthType.NONE },
} as Toolset;

describe('Authentication', () => {
  test('renders field title', () => {
    render(<Authentication toolset={baseToolset} />);
    expect(screen.getByText(EntityFieldsI18nKey.authSettings)).toBeInTheDocument();
  });

  test('renders field title', () => {
    render(<Authentication toolset={{}} />);
    expect(screen.getByText(EntityFieldsI18nKey.authSettings)).toBeInTheDocument();
  });

  test('renders all auth options', () => {
    render(<Authentication toolset={noneToolset} />);
    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.NoneAuth)).toBeInTheDocument();
  });

  test('shows selected state for correct option', () => {
    render(<Authentication toolset={oauthToolset} />);
    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
  });

  test('shows disabled state when disabled', () => {
    render(<Authentication toolset={baseToolset} disabled />);
    expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
  });
});
