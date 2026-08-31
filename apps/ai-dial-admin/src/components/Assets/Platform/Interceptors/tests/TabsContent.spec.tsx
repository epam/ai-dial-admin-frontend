import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({
  getInterceptorConfigurationSchema: vi.fn().mockResolvedValue({ success: true, response: null }),
}));

const interceptor = { name: 'redactor', path: 'redactor', folderId: '' } as DialInterceptorResource;

describe('Interceptor asset TabsContent', () => {
  test('Should render the Properties tab content when active', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} selectedInterceptor={interceptor} onChange={vi.fn()} />);

    expect(screen.getByText(EntityFieldsI18nKey.endpoint)).toBeInTheDocument();
  });

  test('Should render the Configuration tab content when active', () => {
    render(
      <TabsContent activeTab={EntityViewTab.ParameterSchema} selectedInterceptor={interceptor} onChange={vi.fn()} />,
    );

    // No `features.configurationEndpoint` on this interceptor, so no fetch is attempted and the
    // empty state renders — proving the tab is reachable without going through Properties.
    expect(screen.getByText(EntitiesI18nKey.NoConfigurationSchema)).toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.endpoint)).not.toBeInTheDocument();
  });
});
