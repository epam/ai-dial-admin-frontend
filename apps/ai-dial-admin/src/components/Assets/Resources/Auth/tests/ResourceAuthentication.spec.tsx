import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { ToolsetAuthType } from '@/src/models/dial/resource';
import ResourceAuthentication from '../ResourceAuthentication';

describe('ResourceAuthentication', () => {
  test('renders all three auth type options by default', () => {
    render(<ResourceAuthentication name="toolset-1" />);

    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.NoneAuth)).toBeInTheDocument();
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
});
